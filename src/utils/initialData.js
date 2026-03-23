// src/utils/initialData.js
// Use Vite's import.meta.glob to load all images in the assets folder
// eager: true imports the module immediately so we have the URL
const imageModules = import.meta.glob('../assets/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });

// Edit this array to change the default display order of the pages
export const PAGE_ORDER = [
  'zapdos',
  'legendary-birds',
  'rayquaza',
  'hoenn-legendarys',
  'regis',
  'johto-legendarys',
  'legendary-beasts',
  'darkrai',
  'sinnoh-legendarys',
  'unova-trio',





];

const SLOTS_PER_PAGE = 18; // 9 on front, 9 on back

function formatTitle(pageName) {
  return pageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Maps suffixes like 'a1', 'b2', 'c3' to an index (0-8)
function suffixToIndex(suffix) {
  const rowMap = { 'a': 0, 'b': 1, 'c': 2 };
  const rowChar = suffix.charAt(0).toLowerCase();
  const colChar = parseInt(suffix.charAt(1), 10); // 1, 2, 3

  const rowIndex = rowMap[rowChar]; // 0, 1, 2
  const colIndex = colChar - 1; // 0, 1, 2

  if (rowIndex !== undefined && !isNaN(colIndex)) {
    return rowIndex * 3 + colIndex;
  }
  return -1;
}

export function generateInitialData() {
  const pagesData = {}; // pageName -> { images: [], title: string }

  // Group images by page
  for (const [path, url] of Object.entries(imageModules)) {
    // path looks like '../assets/darkrai-a1.png'
    const filename = path.split('/').pop();
    const nameWithoutExt = filename.split('.')[0];

    // Split by the last hyphen to separate page name from suffix
    const lastHyphenIndex = nameWithoutExt.lastIndexOf('-');
    if (lastHyphenIndex === -1) continue;

    const pageName = nameWithoutExt.substring(0, lastHyphenIndex);
    const suffix = nameWithoutExt.substring(lastHyphenIndex + 1); // e.g. "a1"

    const slotIndex = suffixToIndex(suffix);
    if (slotIndex === -1 || slotIndex > 8) continue;

    if (!pagesData[pageName]) {
      pagesData[pageName] = {
        title: formatTitle(pageName),
        slots: Array(9).fill(null), // Just 1 face (9 slots)
      };
    }

    pagesData[pageName].slots[slotIndex] = url;
  }

  // Sort pages according to PAGE_ORDER
  const pageNames = Object.keys(pagesData).sort((a, b) => {
    const indexA = PAGE_ORDER.indexOf(a);
    const indexB = PAGE_ORDER.indexOf(b);

    // If both are in PAGE_ORDER, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A is in PAGE_ORDER, A comes first
    if (indexA !== -1) return -1;
    // If only B is in PAGE_ORDER, B comes first
    if (indexB !== -1) return 1;

    // If neither are in PAGE_ORDER, sort alphabetically
    return a.localeCompare(b);
  });

  const generatedPages = [];
  const generatedTitles = [];

  // We need to group them into 18-slot pages (front and back)
  // Each `pageName` is 9 slots, so 2 pageNames make 1 full binder page
  // If we have an odd number of `pageNames`, the last binder page will only have a front filled.

  for (let i = 0; i < pageNames.length; i += 2) {
    const frontName = pageNames[i];
    const backName = pageNames[i + 1]; // Might be undefined

    const frontData = pagesData[frontName];
    const backData = backName ? pagesData[backName] : { title: '', slots: Array(9).fill(null) };

    // Combine into 18 slots
    const fullPageSlots = [...frontData.slots, ...backData.slots];
    generatedPages.push(fullPageSlots);

    // Add titles
    // For Binder, index * 2 is front, index * 2 + 1 is back
    generatedTitles.push(frontData.title);
    generatedTitles.push(backData.title);
  }

  // Ensure we have at least one empty page if there are no images
  if (generatedPages.length === 0) {
    generatedPages.push(Array(SLOTS_PER_PAGE).fill(null));
  }

  return {
    initialPages: generatedPages,
    initialTitles: generatedTitles
  };
}
