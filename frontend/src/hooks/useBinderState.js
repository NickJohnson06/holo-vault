import { useState, useEffect } from 'react';
import axios from 'axios';
import { generateInitialData } from '../utils/initialData';

const API_BASE = 'http://localhost:8000/api/v1';

// Helper to calculate the flat backend page_number based on the frontend structure
const getBackendPageNumber = (pageIndex, faceOrSlot) => {
  if (typeof faceOrSlot === 'string') {
    return pageIndex * 2 + (faceOrSlot === 'front' ? 0 : 1);
  } else {
    // faceOrSlot is slotIndex (0-17)
    return pageIndex * 2 + (faceOrSlot < 9 ? 0 : 1);
  }
};

// Maps 0-17 back down to 0-8 for the specific face of the page
const getBackendSlotIndex = (slotIndex) => {
  return slotIndex % 9;
};

export function useBinderState(user) {
  const [pages, setPages] = useState([]);
  const [titles, setTitles] = useState([]);
  const [binderId, setBinderId] = useState(null); // Dynamic binder ID based on logged in user
  const [backendPages, setBackendPages] = useState([]); // Array of PageResponse objects cache
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and load data based on the logged-in user
  useEffect(() => {
    if (!user) {
      setPages([]);
      setTitles([]);
      setBackendPages([]);
      setBinderId(null);
      setIsLoading(true);
      return;
    }

    async function loadData() {
      setIsLoading(true);
      try {
        // 1. Fetch binders owned by the current user
        const bindersRes = await axios.get(`${API_BASE}/binders/`);
        const binders = bindersRes.data;
        let activeBinder;

        if (binders.length === 0) {
          // If no binders exist for this user, create a default binder
          const createRes = await axios.post(`${API_BASE}/binders/`, {
            title: "My Pokémon Binder",
            description: "Collection manager"
          });
          activeBinder = createRes.data;
        } else {
          // Use the user's first binder
          activeBinder = binders[0];
        }

        const activeBinderId = activeBinder.id;
        setBinderId(activeBinderId);

        // 2. Fetch all pages associated with this specific binder
        const pagesRes = await axios.get(`${API_BASE}/pages/binder/${activeBinderId}`);
        const loadedBackendPages = pagesRes.data;
        setBackendPages(loadedBackendPages);

        if (loadedBackendPages.length === 0) {
          // Graceful fallback to local default seeding if binder has no pages
          const { initialPages, initialTitles } = generateInitialData();
          setPages(initialPages);
          setTitles(initialTitles);
        } else {
          // Mathematically transform backend pages into the frontend 18-slot dual layout format
          const maxPageNum = loadedBackendPages.reduce((max, p) => Math.max(max, p.page_number), 0);
          const totalFrontendPages = Math.floor(maxPageNum / 2) + 1;

          const newPages = Array.from({ length: totalFrontendPages }, () => Array(18).fill(null));
          const newTitles = Array((maxPageNum + 1)).fill('');

          loadedBackendPages.forEach(p => {
             newTitles[p.page_number] = p.title || '';
             
             // Map card slots perfectly
             const frontendPageIndex = Math.floor(p.page_number / 2);
             const offset = (p.page_number % 2 === 0) ? 0 : 9;
             p.card_slots.forEach(slot => {
                newPages[frontendPageIndex][offset + slot.slot_index] = slot.image_url;
             });
          });

          setPages(newPages);
          setTitles(newTitles);
        }
      } catch (err) {
        console.warn('Backend API connection failed. Falling back to default static data structure...', err);
        const { initialPages, initialTitles } = generateInitialData();
        setPages(initialPages);
        setTitles(initialTitles);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Ensure a backend page object exists before trying to update a slot or title on it
  const ensureBackendPage = async (page_number) => {
    if (!binderId) throw new Error("No active binder ID allocated.");
    
    let page = backendPages.find(p => p.page_number === page_number);
    if (!page) {
      const res = await axios.post(`${API_BASE}/pages/`, {
        binder_id: binderId,
        page_number: page_number,
        title: ""
      });
      page = res.data;
      setBackendPages(prev => [...prev, page]);
    }
    return page;
  };

  const updateTitle = async (pageIndex, face, newTitle) => {
    // 1. Optimistic UI update for snappy user experience
    const titleIndex = getBackendPageNumber(pageIndex, face);
    const newTitles = [...titles];
    while (newTitles.length <= titleIndex) newTitles.push('');
    newTitles[titleIndex] = newTitle;
    setTitles(newTitles);

    // 2. Perform background API update
    try {
      const page = await ensureBackendPage(titleIndex);
      await axios.put(`${API_BASE}/pages/${page.id}`, { title: newTitle });
    } catch (err) {
      console.error('Failed to update title via API', err);
    }
  };

  const updateSlot = async (pageIndex, slotIndex, file) => {
    // 1. Upload file securely via form-data directly to protected S3 endpoint
    let imageUrl = null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API_BASE}/uploads/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      imageUrl = res.data.url;
    } catch (err) {
      console.error('Failed to upload image via Backend S3 API', err);
      throw err;
    }

    // 2. Optimistic exact UI update
    const newPages = [...pages];
    newPages[pageIndex] = [...newPages[pageIndex]];
    newPages[pageIndex][slotIndex] = imageUrl;
    setPages(newPages);

    // 3. Persist the state in the PostgreSQL database automatically
    try {
      const pageNum = getBackendPageNumber(pageIndex, slotIndex);
      const page = await ensureBackendPage(pageNum);
      const internalSlot = getBackendSlotIndex(slotIndex);

      await axios.put(`${API_BASE}/slots/page/${page.id}/index/${internalSlot}`, {
        image_url: imageUrl
      });
    } catch (err) {
      console.error('Failed to update relational database slot status via API', err);
    }
  };

  const clearSlot = async (pageIndex, slotIndex) => {
    // 1. Instantly wipe from Optimistic UI
    const newPages = [...pages];
    newPages[pageIndex] = [...newPages[pageIndex]];
    newPages[pageIndex][slotIndex] = null;
    setPages(newPages);

    // 2. Erase the slot from the backend PostgreSQL securely
    try {
      const pageNum = getBackendPageNumber(pageIndex, slotIndex);
      let page = backendPages.find(p => p.page_number === pageNum);
      if (page) {
        const internalSlot = getBackendSlotIndex(slotIndex);
        await axios.delete(`${API_BASE}/slots/page/${page.id}/index/${internalSlot}`);
      }
    } catch (err) {
      console.error('Failed to delete slot relation via API', err);
    }
  };

  const addPage = async () => {
    const newPages = [...pages, Array(18).fill(null)];
    setPages(newPages);
    
    const newTitles = [...titles, '', ''];
    setTitles(newTitles);
  };
  
  const removePage = async (pageIndex) => {
    if (pages.length <= 1) return;
    
    const newPages = pages.filter((_, i) => i !== pageIndex);
    setPages(newPages);

    const newTitles = [...titles];
    newTitles.splice(pageIndex * 2, 2);
    setTitles(newTitles);

    // Also completely cascade delete them from the PostgreSQL backend
    const frontPageNum = pageIndex * 2;
    const backPageNum = pageIndex * 2 + 1;

    try {
       const frontPg = backendPages.find(p => p.page_number === frontPageNum);
       const backPg = backendPages.find(p => p.page_number === backPageNum);
       if (frontPg) await axios.delete(`${API_BASE}/pages/${frontPg.id}`);
       if (backPg) await axios.delete(`${API_BASE}/pages/${backPg.id}`);
       
       setBackendPages(prev => prev.filter(p => p.page_number !== frontPageNum && p.page_number !== backPageNum));
     } catch (err) {
       console.error("Failed to execute cascading delete via API", err);
     }
  };

  return { 
    pages, 
    titles,
    isLoading, 
    updateTitle,
    updateSlot, 
    clearSlot, 
    addPage, 
    removePage 
  };
}
