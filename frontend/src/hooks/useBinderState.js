import { useState, useEffect } from 'react';
import axios from 'axios';
import { generateInitialData } from '../utils/initialData';

const API_BASE = 'http://localhost:8000/api/v1';
const BINDER_ID = 1; // Hardcoded default for single user mode right now

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

export function useBinderState() {
  const [pages, setPages] = useState([]);
  const [titles, setTitles] = useState([]);
  const [backendPages, setBackendPages] = useState([]); // Array of PageResponse objects cache
  const [isLoading, setIsLoading] = useState(true);

  // Initialize
  useEffect(() => {
    async function loadData() {
      try {
        // Attempt to fetch the primary binder over the network
        let binder;
        try {
          const res = await axios.get(`${API_BASE}/binders/${BINDER_ID}`);
          binder = res.data;
        } catch (err) {
          if (err.response && err.response.status === 404) {
            // Create binder safely if it doesn't already exist in PostgreSQL
            const res = await axios.post(`${API_BASE}/binders/`, { title: "Main Binder" });
            binder = res.data;
          } else {
            throw err;
          }
        }

        // Fetch all pages associated with this binder
        const pagesRes = await axios.get(`${API_BASE}/pages/binder/${BINDER_ID}`);
        const loadedBackendPages = pagesRes.data;
        setBackendPages(loadedBackendPages);

        if (loadedBackendPages.length === 0) {
          // Graceful fallback to local default seeding logic if Backend is pristine 
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
        console.warn('Backend API connection failed. Falling back to default static data structure...');
        const { initialPages, initialTitles } = generateInitialData();
        setPages(initialPages);
        setTitles(initialTitles);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Helpful guardrail to ensure a backend page object exists before trying to update a slot or title on it
  const ensureBackendPage = async (page_number) => {
    let page = backendPages.find(p => p.page_number === page_number);
    if (!page) {
      const res = await axios.post(`${API_BASE}/pages/`, {
        binder_id: BINDER_ID,
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
    // 1. Upload file securely via form-data directly to S3 endpoint
    let imageUrl = null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API_BASE}/uploads/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // The backend returns the S3 url
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
    
    // We don't strictly *need* to call the API to create the empty Page,
    // because ensureBackendPage() will magically handle it when the user assigns a slot.
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
