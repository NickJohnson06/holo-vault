import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { generateInitialData } from '../utils/initialData';

const BINDER_DB_KEY = 'pokemon_binder_data_v3';

// A single page has 18 slots total (9 on the front, 9 on the back)
const SLOTS_PER_PAGE = 18;


// Function to compress image before saving to DB
const compressImage = (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8)); // compressed jpeg
    };
    img.src = dataUrl;
  });
};

const BINDER_TITLES_DB_KEY = 'pokemon_binder_titles_v3';

export function useBinderState() {
  const [pages, setPages] = useState([]);
  const [titles, setTitles] = useState([]); // array where index is pageIndex*2 for front, pageIndex*2+1 for back
  const [isLoading, setIsLoading] = useState(true);

  // Initialize
  useEffect(() => {
    async function loadData() {
      try {
        const [data, titlesData] = await Promise.all([
          get(BINDER_DB_KEY),
          get(BINDER_TITLES_DB_KEY)
        ]);

        if (data && Array.isArray(data)) {
          setPages(data);
          
          if (titlesData && Array.isArray(titlesData)) {
            setTitles(titlesData);
          } else {
            setTitles([]);
          }
        } else {
          // If no data in DB, seed with initial static assets
          const { initialPages, initialTitles } = generateInitialData();
          setPages(initialPages);
          setTitles(initialTitles);
        }
      } catch (err) {
        console.error('Failed to load binder data from IndexedDB', err);
        const { initialPages, initialTitles } = generateInitialData();
        setPages(initialPages);
        setTitles(initialTitles);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const saveToDb = async (newPages) => {
    setPages(newPages);
    try {
      await set(BINDER_DB_KEY, newPages);
    } catch (err) {
      console.error('Failed to save binder data to IndexedDB', err);
    }
  };

  const saveTitlesToDb = async (newTitles) => {
    setTitles(newTitles);
    try {
      await set(BINDER_TITLES_DB_KEY, newTitles);
    } catch (err) {
      console.error('Failed to save binder titles to IndexedDB', err);
    }
  };

  const updateTitle = async (pageIndex, face, newTitle) => {
    const titleIndex = face === 'front' ? pageIndex * 2 : pageIndex * 2 + 1;
    const newTitles = [...titles];
    // Grow array if needed
    while (newTitles.length <= titleIndex) {
      newTitles.push('');
    }
    newTitles[titleIndex] = newTitle;
    await saveTitlesToDb(newTitles);
  };

  const updateSlot = async (pageIndex, slotIndex, file) => {
    // Read file, optionally compress, then set state
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const compressedDataUrl = await compressImage(e.target.result);
          const newPages = [...pages];
          newPages[pageIndex] = [...newPages[pageIndex]];
          newPages[pageIndex][slotIndex] = compressedDataUrl;
          await saveToDb(newPages);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const clearSlot = async (pageIndex, slotIndex) => {
    const newPages = [...pages];
    newPages[pageIndex] = [...newPages[pageIndex]];
    newPages[pageIndex][slotIndex] = null;
    await saveToDb(newPages);
  };

  const addPage = async () => {
    const newPages = [...pages, Array(SLOTS_PER_PAGE).fill(null)];
    await saveToDb(newPages);
    // Also add title spots for the new page
    const newTitles = [...titles, '', ''];
    await saveTitlesToDb(newTitles);
  };
  
  const removePage = async (pageIndex) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== pageIndex);
    await saveToDb(newPages);

    // Remove titles for front and back (indices pageIndex*2, pageIndex*2+1)
    const newTitles = [...titles];
    newTitles.splice(pageIndex * 2, 2);
    await saveTitlesToDb(newTitles);
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
