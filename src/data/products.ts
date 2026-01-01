export interface Product {
    code: string;
    inspiredByName: string;
    house: string;
    gender: 'men' | 'women';
    line: 'FM' | 'HM' | 'UM';
    category: string | null;
    image: string;
    popularity: number;
}

export const products: Product[] = [
    // WOMEN (10)
    {
        code: 'FM 2054',
        inspiredByName: 'Light Blue',
        house: 'Dolce & Gabbana',
        gender: 'women',
        line: 'FM',
        category: 'Floral',
        image: '/images/fm-2054.png',
        popularity: 85,
    },
    {
        code: 'FM 2041',
        inspiredByName: "J'adore",
        house: 'Christian Dior',
        gender: 'women',
        line: 'FM',
        category: null,
        image: '/images/fm-2041.webp',
        popularity: 92,
    },
    {
        code: 'FM 2035',
        inspiredByName: 'Chanel N°5',
        house: 'Chanel',
        gender: 'women',
        line: 'FM',
        category: 'Floral frutal',
        image: '/images/fm-2035.webp',
        popularity: 98,
    },
    {
        code: 'FM 2028',
        inspiredByName: 'Good Girl',
        house: 'Carolina Herrera',
        gender: 'women',
        line: 'FM',
        category: 'Oriental-floral',
        image: '/images/fm-2028.webp',
        popularity: 94,
    },
    {
        code: 'FM 2093',
        inspiredByName: 'La Vie Est Belle',
        house: 'Lancôme',
        gender: 'women',
        line: 'FM',
        category: 'Oriental-floral',
        image: '/images/fm-2093.png',
        popularity: 96,
    },
    {
        code: 'FM 2066',
        inspiredByName: 'SÍ 2013',
        house: 'Giorgio Armani',
        gender: 'women',
        line: 'FM',
        category: 'Frutal',
        image: '/images/fm-2066.png',
        popularity: 78,
    },
    {
        code: 'FM 2105',
        inspiredByName: 'Lady Million',
        house: 'Paco Rabanne',
        gender: 'women',
        line: 'FM',
        category: 'Flores frutal',
        image: '/images/fm-2105.webp',
        popularity: 88,
    },
    {
        code: 'FM 2107',
        inspiredByName: 'Olympea',
        house: 'Paco Rabanne',
        gender: 'women',
        line: 'FM',
        category: 'Floral oriental',
        image: '/images/fm-2107.webp',
        popularity: 82,
    },
    {
        code: 'FM 2122',
        inspiredByName: 'Bright Crystal',
        house: 'Versace',
        gender: 'women',
        line: 'FM',
        category: null,
        image: '/images/fm-2122.webp',
        popularity: 79,
    },
    {
        code: 'FM 2087',
        inspiredByName: 'Flower by Kenzo',
        house: 'Kenzo',
        gender: 'women',
        line: 'FM',
        category: null,
        image: '/images/fm-2087.png',
        popularity: 75,
    },

    // MEN (10)
    {
        code: 'HM 1010',
        inspiredByName: 'Aventus',
        house: 'Creed',
        gender: 'men',
        line: 'HM',
        category: null,
        image: '/images/hm-1010.png',
        popularity: 97,
    },
    {
        code: 'HM 1034',
        inspiredByName: 'Acqua di Gio',
        house: 'Giorgio Armani',
        gender: 'men',
        line: 'HM',
        category: 'Aroma acuático',
        image: '/images/hm-1034.png',
        popularity: 91,
    },
    {
        code: 'HM 1035',
        inspiredByName: 'Acqua di Gio Profumo',
        house: 'Giorgio Armani',
        gender: 'men',
        line: 'HM',
        category: null,
        image: '/images/hm-1035.webp',
        popularity: 86,
    },
    {
        code: 'HM 1059',
        inspiredByName: 'Le Male',
        house: 'Jean Paul Gaultier',
        gender: 'men',
        line: 'HM',
        category: 'Oriental',
        image: '/images/hm-1059.avif',
        popularity: 84,
    },
    {
        code: 'HM 1073',
        inspiredByName: '1 Million',
        house: 'Paco Rabanne',
        gender: 'men',
        line: 'HM',
        category: 'Amaderado',
        image: '/images/hm-1073.webp',
        popularity: 95,
    },
    {
        code: 'HM 1078',
        inspiredByName: 'Invictus',
        house: 'Paco Rabanne',
        gender: 'men',
        line: 'HM',
        category: null,
        image: '/images/hm-1078.webp',
        popularity: 89,
    },
    {
        code: 'HM 1026',
        inspiredByName: 'Sauvage',
        house: 'Christian Dior',
        gender: 'men',
        line: 'HM',
        category: null,
        image: '/images/hm-1026.webp',
        popularity: 99,
    },
    {
        code: 'HM 1027',
        inspiredByName: 'Sauvage Elixir',
        house: 'Christian Dior',
        gender: 'men',
        line: 'HM',
        category: null,
        image: '/images/hm-1027.jpg',
        popularity: 90,
    },
    {
        code: 'HM 1095',
        inspiredByName: 'Eros Pour Homme',
        house: 'Versace',
        gender: 'men',
        line: 'HM',
        category: null,
        image: '/images/hm-1095.webp',
        popularity: 87,
    },
    {
        code: 'HM 1045',
        inspiredByName: 'Boss Bottled',
        house: 'Hugo Boss',
        gender: 'men',
        line: 'HM',
        category: 'Amaderado',
        image: '/images/hm-1045.webp',
        popularity: 83,
    },
];

// Iconic products for the carousel - exactly 6, alternating women/men
export const iconicProductCodes = [
    'FM 2035', // Chanel N°5 - women
    'HM 1026', // Sauvage - men
    'FM 2093', // La Vie Est Belle - women
    'HM 1010', // Aventus - men
    'FM 2028', // Good Girl - women
    'HM 1073', // 1 Million - men
];

export const getIconicProducts = (): Product[] => {
    return iconicProductCodes
        .map((code) => products.find((p) => p.code === code))
        .filter((p): p is Product => p !== undefined);
};

export const getProductByCode = (code: string): Product | undefined => {
    return products.find((p) => p.code === code);
};

// Get unique values for filters
export const getUniqueHouses = (): string[] => {
    return [...new Set(products.map((p) => p.house))].sort();
};

export const getUniqueCategories = (): string[] => {
    return [...new Set(products.map((p) => p.category).filter((c): c is string => c !== null))].sort();
};

export const getUniqueLines = (): string[] => {
    return [...new Set(products.map((p) => p.line))].sort();
};
