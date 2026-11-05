export const DEFAULT_PRODUCT_IMAGES: Record<string, string> = {
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80',
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80',
  almonds: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&auto=format&fit=crop&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&auto=format&fit=crop&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&auto=format&fit=crop&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=80',
  orange: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400&auto=format&fit=crop&q=80',
  grapes: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&auto=format&fit=crop&q=80',
  garlic: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&auto=format&fit=crop&q=80',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&auto=format&fit=crop&q=80',
  chili: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&auto=format&fit=crop&q=80',
  coriander: 'https://images.unsplash.com/photo-1599818814526-72412e6caec7?w=400&auto=format&fit=crop&q=80',
  pomegranate: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&auto=format&fit=crop&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&auto=format&fit=crop&q=80',
  cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&auto=format&fit=crop&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  papaya: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&auto=format&fit=crop&q=80',
  watermelon: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=80',
  lemon: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=400&auto=format&fit=crop&q=80',
  cucumber: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&auto=format&fit=crop&q=80',
  peas: 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=400&auto=format&fit=crop&q=80',
};

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop&q=80',
  vegetables: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&auto=format&fit=crop&q=80',
  'leafy vegetables': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80',
  'dry fruits': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  fruits: '🍎',
  vegetables: '🥕',
  'leafy vegetables': '🥬',
  'dry fruits': '🥜',
  grains: '🌾',
  spices: '🌶️',
  pulses: '🫘',
  default: '📦',
};

export function getProductEmoji(name?: string, category?: string): string {
  if (!name) return '📦';
  const n = name.toLowerCase().trim();
  if (n.includes('banana')) return '🍌';
  if (n.includes('apple')) return '🍎';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('spinach')) return '🥬';
  if (n.includes('almond') || n.includes('badam')) return '🥜';
  if (n.includes('mango')) return '🥭';
  if (n.includes('potato') || n.includes('aloo')) return '🥔';
  if (n.includes('onion') || n.includes('pyaz')) return '🧅';
  if (n.includes('carrot') || n.includes('gajar')) return '🥕';
  if (n.includes('orange') || n.includes('santra')) return '🍊';
  if (n.includes('grape')) return '🍇';
  if (n.includes('garlic') || n.includes('lahsun')) return '🧄';
  if (n.includes('chilli') || n.includes('mirchi')) return '🌶️';
  if (n.includes('pomegranate') || n.includes('anar')) return '🍈';
  if (n.includes('watermelon') || n.includes('tarbooj')) return '🍉';
  if (n.includes('lemon') || n.includes('nimbu')) return '🍋';
  if (n.includes('cucumber') || n.includes('kheera')) return '🥒';
  if (n.includes('ginger') || n.includes('adrak')) return '🫚';
  if (n.includes('corn')) return '🌽';

  if (category) {
    const c = category.toLowerCase().trim();
    if (CATEGORY_EMOJIS[c]) return CATEGORY_EMOJIS[c];
  }

  return '📦';
}

export function getProductImage(product?: {
  name?: string;
  category?: string;
  image?: string;
}): string {
  if (!product) return DEFAULT_CATEGORY_IMAGES.default;

  // 1. If explicit valid image is assigned, return it
  if (product.image && typeof product.image === 'string' && product.image.trim().startsWith('http')) {
    return product.image.trim();
  }

  const nameKey = (product.name || '').toLowerCase().trim();

  // 2. Exact match in default images
  if (DEFAULT_PRODUCT_IMAGES[nameKey]) {
    return DEFAULT_PRODUCT_IMAGES[nameKey];
  }

  // 3. Substring match
  for (const [key, url] of Object.entries(DEFAULT_PRODUCT_IMAGES)) {
    if (nameKey.includes(key) || key.includes(nameKey)) {
      return url;
    }
  }

  // 4. Category fallback match
  const catKey = (product.category || '').toLowerCase().trim();
  if (DEFAULT_CATEGORY_IMAGES[catKey]) {
    return DEFAULT_CATEGORY_IMAGES[catKey];
  }

  return DEFAULT_CATEGORY_IMAGES.default;
}
