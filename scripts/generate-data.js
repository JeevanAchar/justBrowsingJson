import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data', 'food');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Timestamp strictly in UTC ISO-8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
const TIMESTAMP_UTC = '2026-09-08T03:15:42.000Z';

// Restaurant Ambiance / Banner photos (16 unique photos)
const restaurantPhotos = [
  {
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    desc: 'Spacious royal dining hall with traditional lighting at Bawarchi Biryani Mahal',
    tags: ['hyderabad', 'biryani-house', 'ambience', 'dining-hall']
  },
  {
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    desc: 'Warm and vibrant North Indian dining interior at Punjab Grill & Spice',
    tags: ['delhi', 'punjabi', 'interior', 'restaurant']
  },
  {
    url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
    desc: 'Serene South Indian ethnic ambience at Dakshin Flavours',
    tags: ['chennai', 'south-indian', 'ambience', 'traditional']
  },
  {
    url: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1200&q=80',
    desc: 'Atmospheric oriental dining lounge with lantern glow at The Golden Dragon',
    tags: ['kolkata', 'chinese', 'asian', 'dining']
  },
  {
    url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    desc: 'Bustling clean vegetarian dining hall at Udupi Sri Krishna Bhavan',
    tags: ['bengaluru', 'udupi', 'pure-veg', 'hall']
  },
  {
    url: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=80',
    desc: 'Regal carved wooden dining setting at Kashmir Wazwan Treats',
    tags: ['delhi', 'kashmiri', 'wazwan', 'heritage']
  },
  {
    url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    desc: 'Sunlit coastal patio dining by the seaside at Goan Coastal Shack',
    tags: ['goa', 'coastal', 'beach-vibe', 'shack']
  },
  {
    url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
    desc: 'Heritage Dastarkhwan velvet dining salon at Nawab\'s Awadhi Dastarkhwan',
    tags: ['lucknow', 'awadhi', 'nawabi', 'heritage']
  },
  {
    url: 'https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?auto=format&fit=crop&w=1200&q=80',
    desc: 'Charming rustic Italian trattoria bistro at Trattoria Bella Napoli',
    tags: ['bengaluru', 'italian', 'trattoria', 'pizzeria']
  },
  {
    url: 'https://images.unsplash.com/photo-1525610553991-78571db6295a?auto=format&fit=crop&w=1200&q=80',
    desc: 'Lively Mumbai cafe counter serving hot chai and bun maska',
    tags: ['mumbai', 'chai-point', 'cafe', 'fast-food']
  },
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    desc: 'Artisanal sweet showcase counter at Sweet Bengal Confectionery',
    tags: ['kolkata', 'dessert-shop', 'sweet-store', 'bengali']
  },
  {
    url: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1200&q=80',
    desc: 'Vibrant spice kitchen dining space at Andhra Spice Kitchen',
    tags: ['vijayawada', 'andhra', 'spicy', 'dining']
  },
  {
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    desc: 'Industrial retro burger diner ambience at The Burger Garage',
    tags: ['bengaluru', 'burger-joint', 'diner', 'american']
  },
  {
    url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
    desc: 'Verdant tropical Malabar courtyard dining at Kerala Malabar Delights',
    tags: ['kochi', 'malabar', 'kerala', 'courtyard']
  },
  {
    url: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?auto=format&fit=crop&w=1200&q=80',
    desc: 'Grand royal Rajasthani sit-down thali restaurant at Rajdhani Thali Samrat',
    tags: ['ahmedabad', 'rajasthani', 'thali', 'palace-theme']
  },
  {
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    desc: 'Heritage South Indian breakfast hall with brass tumblers at Madras Filter Kaapi & Tiffin',
    tags: ['chennai', 'mylapore', 'filter-coffee', 'tiffin-house']
  }
];

// Restaurant definitions
const restaurantsData = [
  {
    name: 'Bawarchi Biryani Mahal',
    description: 'Legendary Nizami biryani house in Hyderabad, slow-cooking tender meat and fragranced long-grain basmati with heritage spices.',
    rating: 4.6,
    total_orders: 34200,
    location: {
      address: 'Plot 44, RTC X Roads, Chikkadpally',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500020',
      latitude: 17.4042,
      longitude: 78.4975
    },
    delivery_time: { min: 25, max: 40 },
    cuisines: ['Biryani', 'Hyderabadi', 'Mughlai'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Biryani Delicacies', 'Starters & Sides', 'Desserts & Beverages'],
    collectionNames: ['Royal Bestsellers', 'Biryani Feast', 'Under ₹250'],
    foods: [
      {
        name: 'Hyderabadi Chicken Dum Biryani',
        description: 'Authentic kacchi dum biryani layered with marinated chicken, saffron rice, caramelized onions, and pot-sealed aromatics.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 720,
        base_price: 320,
        selling_price: 269,
        tags: ['bestseller', 'biryani', 'chicken', 'hyderabadi'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Hyderabadi chicken dum biryani served with salan and boiled egg',
        imageTags: ['biryani', 'chicken', 'rice', 'hyderabadi']
      },
      {
        name: 'Nizami Mutton Biryani',
        description: 'Succulent baby goat meat tenderly cooked with aged basmati rice, royal spices, and infused with saffron and desi ghee.',
        rating: 4.8,
        dietary_type: 'non_veg',
        calories: 850,
        base_price: 440,
        selling_price: 389,
        tags: ['mutton', 'royal', 'biryani', 'spicy'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Gourmet Hyderabadi mutton dum biryani garnished with fried onions',
        imageTags: ['biryani', 'mutton', 'mughlai', 'spicy']
      },
      {
        name: 'Hyderabadi Mirchi Ka Salan',
        description: 'Traditional peanut, sesame, and coconut gravy simmered with lightly charred bhavnagri chillies.',
        rating: 4.4,
        dietary_type: 'veg',
        calories: 240,
        base_price: 160,
        selling_price: 139,
        tags: ['curry', 'side-dish', 'spicy', 'traditional'],
        catIndex: 1,
        colIndices: [2],
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Hot tangy chili gravy served as accompaniment for biryani',
        imageTags: ['salan', 'curry', 'hyderabadi', 'vegetarian']
      },
      {
        name: 'Andhra Chicken 65',
        description: 'Crispy deep-fried chicken cubes tossed with curry leaves, crushed green chillies, garlic, and freshly ground pepper.',
        rating: 4.6,
        dietary_type: 'non_veg',
        calories: 410,
        base_price: 280,
        selling_price: 239,
        tags: ['starter', 'chicken', 'crispy', 'spicy'],
        catIndex: 1,
        colIndices: [0, 2],
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Red crispy spiced chicken 65 starter served on a platter',
        imageTags: ['starter', 'chicken-65', 'andhra', 'spicy']
      },
      {
        name: 'Double Ka Meetha',
        description: 'Crispy fried bread slices soaked in thickened saffron cardamom milk, topped with sliced pistachios and almonds.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 380,
        base_price: 150,
        selling_price: 129,
        tags: ['dessert', 'sweet', 'shahi', 'hyderabadi'],
        catIndex: 2,
        colIndices: [2],
        imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden soaked dessert garnished with crushed dry fruits and saffron',
        imageTags: ['dessert', 'sweet', 'hyderabadi', 'pudding']
      },
      {
        name: 'Kadak Irani Chai',
        description: 'Rich, thick, slow-boiled milk tea brewed with crushed cardamom, cinnamon, and special Assam tea leaves.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 120,
        base_price: 60,
        selling_price: 49,
        tags: ['beverage', 'tea', 'hot', 'irani'],
        catIndex: 2,
        colIndices: [2],
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Steaming glass cup of aromatic Irani chai tea',
        imageTags: ['tea', 'chai', 'beverage', 'hot']
      }
    ]
  },
  {
    name: 'Punjab Grill & Spice',
    description: 'Authentic highway dhaba and fine Punjabi culinary destination renowned for buttery curries and charcoal tandoor delights.',
    rating: 4.7,
    total_orders: 28900,
    location: {
      address: 'Scindia House, Outer Circle, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110001',
      latitude: 28.6315,
      longitude: 77.2167
    },
    delivery_time: { min: 30, max: 45 },
    cuisines: ['North Indian', 'Punjabi', 'Mughlai'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Tandoori Starters', 'Main Course Curries', 'Breads & Sweets'],
    collectionNames: ['Chef Recommendations', 'Punjabi Classics'],
    foods: [
      {
        name: 'Murgh Makhani Butter Chicken',
        description: 'Charcoal-grilled chicken pieces simmered in silky tomato gravy rich with white butter, cream, and dried fenugreek leaves.',
        rating: 4.8,
        dietary_type: 'non_veg',
        calories: 680,
        base_price: 380,
        selling_price: 329,
        tags: ['butter-chicken', 'curry', 'bestseller', 'creamy'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Rich velvety butter chicken curry served in a copper handi',
        imageTags: ['butter-chicken', 'curry', 'punjabi', 'non-veg']
      },
      {
        name: 'Dal Makhani Bukhara Style',
        description: 'Whole black lentils and kidney beans slow-simmered overnight over charcoal embers with butter and cream.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 460,
        base_price: 290,
        selling_price: 249,
        tags: ['dal-makhani', 'lentils', 'vegetarian', 'classic'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Creamy slow-cooked dal makhani garnished with fresh cream swirl',
        imageTags: ['dal', 'dal-makhani', 'north-indian', 'vegetarian']
      },
      {
        name: 'Tandoori Paneer Tikka',
        description: 'Fresh malai paneer cubes marinated in hung curd, Kashmiri chilli, mustard oil, and char-grilled on clay skewers.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 390,
        base_price: 290,
        selling_price: 259,
        tags: ['paneer', 'tikka', 'tandoor', 'starter'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Char-grilled spicy paneer tikka with capsicum and onion rings',
        imageTags: ['paneer-tikka', 'tandoor', 'starter', 'paneer']
      },
      {
        name: 'Garlic Butter Naan',
        description: 'Leavened soft wheat bread baked in clay tandoor, brushed generously with melted butter and roasted garlic flakes.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 210,
        base_price: 75,
        selling_price: 65,
        tags: ['bread', 'naan', 'garlic', 'tandoor'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Freshly baked garlic butter naan bread hot from the tandoor',
        imageTags: ['naan', 'bread', 'garlic-bread', 'indian-bread']
      },
      {
        name: 'Amritsari Aloo Kulcha',
        description: 'Flaky layered bread stuffed with spiced mashed potatoes, crushed coriander seeds, and pomegranate powder.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 280,
        base_price: 110,
        selling_price: 95,
        tags: ['kulcha', 'amritsari', 'potato', 'bread'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Crusty golden Amritsari stuffed kulcha bread with butter',
        imageTags: ['kulcha', 'amritsari', 'bread', 'punjabi']
      },
      {
        name: 'Gulab Jamun with Rabri',
        description: 'Warm soft milk khoya dumplings soaked in rose water syrup, served over chilled saffron rabri.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 350,
        base_price: 140,
        selling_price: 120,
        tags: ['gulab-jamun', 'dessert', 'sweet', 'rabri'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Warm golden brown gulab jamun in floral sugar syrup',
        imageTags: ['dessert', 'gulab-jamun', 'sweet', 'indian']
      }
    ]
  },
  {
    name: 'Dakshin Flavours',
    description: 'Celebrating the coastal, temple, and heritage culinary arts of Tamil Nadu, Kerala, and Chettinad.',
    rating: 4.5,
    total_orders: 21500,
    location: {
      address: '32 Burkit Road, T. Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600017',
      latitude: 13.0418,
      longitude: 80.2341
    },
    delivery_time: { min: 20, max: 35 },
    cuisines: ['South Indian', 'Chettinad', 'Kerala'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Tiffin & Breakfast', 'Chettinad Curries', 'Beverages'],
    collectionNames: ['South Indian Special', 'Traditional Breakfast'],
    foods: [
      {
        name: 'Ghee Masala Dosa',
        description: 'Crisp golden crepe roasted with pure desi ghee, filled with spiced potato onion mash, served with three chutneys and hot sambar.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 380,
        base_price: 140,
        selling_price: 119,
        tags: ['dosa', 'masala-dosa', 'ghee', 'breakfast'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Crisp rolled masala dosa with spiced potato filling and fresh chutneys',
        imageTags: ['dosa', 'south-indian', 'breakfast', 'ghee']
      },
      {
        name: 'Medu Vada Platter',
        description: 'Two crispy golden black gram donuts crunchy on the outside and fluffy inside, served with freshly grated coconut chutney and drumstick sambar.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 260,
        base_price: 95,
        selling_price: 80,
        tags: ['vada', 'tiffin', 'crispy', 'snack'],
        catIndex: 0,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden crispy medu vada served with steaming hot lentil sambar',
        imageTags: ['vada', 'tiffin', 'south-indian', 'chutney']
      },
      {
        name: 'Chettinad Pepper Chicken',
        description: 'Country chicken simmered in stone-ground roasted spices, fiery black peppercorns, shallots, and fragrant curry leaves.',
        rating: 4.6,
        dietary_type: 'non_veg',
        calories: 520,
        base_price: 340,
        selling_price: 295,
        tags: ['chettinad', 'spicy', 'chicken', 'curry'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Dark spiced Chettinad pepper chicken curry in a traditional bowl',
        imageTags: ['chettinad', 'curry', 'chicken', 'pepper']
      },
      {
        name: 'Appam with Vegetable Stew',
        description: 'Soft lacy fermented rice pancakes with pillowy spongy center, paired with mild coconut milk and garden veggie stew.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 310,
        base_price: 190,
        selling_price: 165,
        tags: ['appam', 'kerala', 'stew', 'coconut'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Lacy rimmed appam pancake served with aromatic vegetable coconut stew',
        imageTags: ['appam', 'kerala', 'breakfast', 'stew']
      },
      {
        name: 'Kerala Parotta with Egg Roast',
        description: 'Layered flaky Kerala parottas served with two hard-boiled eggs coated in thick spicy caramelized onion tomato masala.',
        rating: 4.5,
        dietary_type: 'egg',
        calories: 480,
        base_price: 220,
        selling_price: 189,
        tags: ['egg', 'parotta', 'kerala', 'spicy'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Flaky layered bread with caramelized egg roast curry',
        imageTags: ['parotta', 'egg', 'kerala', 'roast']
      },
      {
        name: 'Madras Filter Coffee',
        description: 'Brewed using traditional brass chicory drip filter, frothed high with creamy hot milk and cane sugar.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 110,
        base_price: 55,
        selling_price: 45,
        tags: ['filter-coffee', 'kaapi', 'beverage', 'bestseller'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Foamy South Indian filter coffee in traditional brass davarah tumbler',
        imageTags: ['coffee', 'filter-coffee', 'hot', 'beverage']
      }
    ]
  },
  {
    name: 'The Golden Dragon',
    description: 'Iconic Chinatown legacy restaurant serving sizzling woks, Indo-Chinese noodles, and delicate handmade dim sums.',
    rating: 4.4,
    total_orders: 18300,
    location: {
      address: '14 Park Street, Near Mocambo',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      pincode: '700016',
      latitude: 22.5532,
      longitude: 88.3524
    },
    delivery_time: { min: 25, max: 40 },
    cuisines: ['Indo-Chinese', 'Chinese', 'Asian'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Dim Sum & Appetizers', 'Noodles & Rice', 'Wok Specials'],
    collectionNames: ['Dragon Bestsellers', 'Pocket Meals'],
    foods: [
      {
        name: 'Veg Hakka Noodles',
        description: 'Wok-tossed thin wheat noodles with crisp cabbage, bell peppers, carrots, spring onions, and light soy seasoning.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 390,
        base_price: 210,
        selling_price: 179,
        tags: ['noodles', 'hakka', 'chinese', 'vegetarian'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Tossed stir-fried veg noodles with colorful julienne vegetables',
        imageTags: ['noodles', 'hakka', 'chinese', 'asian']
      },
      {
        name: 'Chilli Chicken Kolkata Style',
        description: 'Tender chicken cubes battered and wok-tossed in pungent dark soya sauce, spicy green chillies, and crunchy capsicum.',
        rating: 4.6,
        dietary_type: 'non_veg',
        calories: 430,
        base_price: 290,
        selling_price: 249,
        tags: ['chilli-chicken', 'indo-chinese', 'bestseller', 'chicken'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Glossy wok-tossed Indo-Chinese spicy chili chicken starter',
        imageTags: ['chilli-chicken', 'spicy', 'chicken', 'chinese']
      },
      {
        name: 'Schezwan Chicken Fried Rice',
        description: 'Long grain rice tossed over high flame with diced chicken, eggs, fiery house Schezwan pepper paste, and spring onion greens.',
        rating: 4.5,
        dietary_type: 'non_veg',
        calories: 560,
        base_price: 270,
        selling_price: 229,
        tags: ['fried-rice', 'schezwan', 'spicy', 'chinese'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Fiery red Schezwan fried rice wok-tossed with egg and chicken bits',
        imageTags: ['rice', 'fried-rice', 'schezwan', 'asian']
      },
      {
        name: 'Steamed Chicken Dim Sum',
        description: 'Six delicate translucent dumplings packed with minced chicken, ginger, and scallions, served with spicy chilli dip.',
        rating: 4.4,
        dietary_type: 'non_veg',
        calories: 290,
        base_price: 240,
        selling_price: 199,
        tags: ['dim-sum', 'dumplings', 'steamed', 'appetizer'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Bamboo basket filled with steamed delicate chicken dim sums',
        imageTags: ['dim-sum', 'dumplings', 'steamed', 'chinese']
      },
      {
        name: 'Crispy Veg Spring Rolls',
        description: 'Crisp golden rolls packed with shredded stir-fried vegetables and glass noodles, served with sweet chilli garlic sauce.',
        rating: 4.3,
        dietary_type: 'veg',
        calories: 310,
        base_price: 180,
        selling_price: 149,
        tags: ['spring-rolls', 'crispy', 'starter', 'vegetarian'],
        catIndex: 0,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden crispy vegetable spring rolls sliced diagonally with dip',
        imageTags: ['spring-rolls', 'crispy', 'starter', 'asian']
      },
      {
        name: 'Sweet Corn Chicken Soup',
        description: 'Classic velvety warm soup prepared with crushed cream corn kernels, tender shredded chicken, and beaten egg ribbons.',
        rating: 4.4,
        dietary_type: 'non_veg',
        calories: 180,
        base_price: 160,
        selling_price: 135,
        tags: ['soup', 'sweet-corn', 'warm', 'comfort-food'],
        catIndex: 0,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Warm bowl of comforting sweet corn chicken soup',
        imageTags: ['soup', 'sweet-corn', 'chicken', 'warm']
      }
    ]
  },
  {
    name: 'Udupi Sri Krishna Bhavan',
    description: 'Heritage Karnataka pure vegetarian eatery serving time-tested breakfast tiffins, fragrant filter coffee, and hearty thalis.',
    rating: 4.8,
    total_orders: 42100,
    location: {
      address: 'Sampige Road, Malleswaram 8th Cross',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560003',
      latitude: 13.0033,
      longitude: 77.5713
    },
    delivery_time: { min: 15, max: 30 },
    cuisines: ['South Indian', 'Fast Food', 'Pure Veg'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Morning Tiffin', 'Rice Specialties', 'Sweets & Shakes'],
    collectionNames: ['Daily Staples', 'Under ₹100'],
    foods: [
      {
        name: 'Steamed Idli with Sambar',
        description: 'Two cloud-soft fermented rice-lentil steamed cakes served submerged in piping hot lentil vegetable sambar and spicy coconut chutney.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 180,
        base_price: 70,
        selling_price: 59,
        tags: ['idli', 'sambar', 'healthy', 'breakfast'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Steaming white idlis served with vegetable sambar and red coconut chutney',
        imageTags: ['idli', 'south-indian', 'sambar', 'healthy']
      },
      {
        name: 'Ghee Mysore Masala Dosa',
        description: 'Thick crisp dosa smeared inside with fiery red garlic chutney, filled with potato bhaji, and roasted in rich clarified butter.',
        rating: 4.9,
        dietary_type: 'veg',
        calories: 420,
        base_price: 140,
        selling_price: 119,
        tags: ['mysore-masala-dosa', 'ghee', 'bestseller', 'dosa'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Crispy butter roasted Mysore masala dosa folded with chutney paste',
        imageTags: ['dosa', 'mysore-masala', 'ghee', 'breakfast']
      },
      {
        name: 'Karnataka Bisi Bele Bath',
        description: 'Classic Mysore rice and toor dal mash cooked with seasonal vegetables, tamarind pulp, house spice mix, and cashew nuts in ghee.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 380,
        base_price: 120,
        selling_price: 99,
        tags: ['bisi-bele-bath', 'rice', 'karnataka', 'comfort-food'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Spiced hot lentil vegetable rice bath garnished with boondi and cashews',
        imageTags: ['rice', 'bisi-bele-bath', 'karnataka', 'traditional']
      },
      {
        name: 'Rava Kesari Bath',
        description: 'Golden semolina pudding simmered with pure ghee, saffron threads, cardamom, plump raisins, and golden fried cashew nuts.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 310,
        base_price: 80,
        selling_price: 69,
        tags: ['kesari', 'sweet', 'ghee', 'dessert'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1563729784-fe03868a174a?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Glossy golden rava kesari bath studded with cashews in a cup',
        imageTags: ['kesari', 'sweet', 'dessert', 'rava']
      },
      {
        name: 'Classic Curd Rice',
        description: 'Cooling seasoned yogurt rice tempered with mustard seeds, curry leaves, ginger, pomegranate arils, and green chillies.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 250,
        base_price: 90,
        selling_price: 75,
        tags: ['curd-rice', 'comfort-food', 'soothing', 'rice'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Tempered curd rice with mustard seed tadka and pomegranate pearls',
        imageTags: ['curd-rice', 'healthy', 'rice', 'vegetarian']
      },
      {
        name: 'Kesar Badam Milk',
        description: 'Creamy reduced milk beverage infused with crushed almonds, real saffron strands, and fragrant green cardamom.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 210,
        base_price: 75,
        selling_price: 65,
        tags: ['badam-milk', 'kesar', 'drink', 'milk'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Chilled rich almond saffron milk served with crushed pistachio topping',
        imageTags: ['badam-milk', 'shake', 'beverage', 'almond']
      }
    ]
  },
  {
    name: 'Kashmir Wazwan Treats',
    description: 'Master Ustads preparing exquisite 36-course Kashmiri Wazwan feast items infused with wild mountain herbs and saffron.',
    rating: 4.6,
    total_orders: 12400,
    location: {
      address: '22 Hauz Khas Village',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110016',
      latitude: 28.5494,
      longitude: 77.1932
    },
    delivery_time: { min: 35, max: 50 },
    cuisines: ['North Indian', 'Kashmiri', 'Mughlai'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Wazwan Curries', 'Pulao & Breads', 'Traditional Drinks'],
    collectionNames: ['Kashmiri Royal Feast', 'Chef Curated'],
    foods: [
      {
        name: 'Kashmiri Rogan Josh',
        description: 'Tender mutton shanks slow-braised in yogurt, Kashmiri red chillies, dry ginger powder, and crushed fennel seeds without onions.',
        rating: 4.8,
        dietary_type: 'non_veg',
        calories: 640,
        base_price: 440,
        selling_price: 389,
        tags: ['rogan-josh', 'mutton', 'kashmiri', 'wazwan'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Deep red Kashmiri Rogan Josh mutton curry in traditional bowl',
        imageTags: ['rogan-josh', 'mutton', 'kashmiri', 'curry']
      },
      {
        name: 'Kashmiri Dum Aloo',
        description: 'Baby potatoes deep-fried until blistered, then simmered in a velvet yogurt sauce scented with mawal petals and hing.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 390,
        base_price: 280,
        selling_price: 239,
        tags: ['dum-aloo', 'vegetarian', 'kashmiri', 'curry'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Spiced baby potatoes in rich Kashmiri gravy garnished with coriander',
        imageTags: ['dum-aloo', 'potato', 'curry', 'kashmiri']
      },
      {
        name: 'Gushtaba in Yakhni Gravy',
        description: 'Hand-pounded mutton meatballs with fragrant spices, slow-poached in silky yogurt and wild saffron broth.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 590,
        base_price: 470,
        selling_price: 419,
        tags: ['gushtaba', 'mutton', 'wazwan', 'heritage'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Plump savory mutton gushtaba spheres simmered in velvety white gravy',
        imageTags: ['gushtaba', 'wazwan', 'mutton', 'gravy']
      },
      {
        name: 'Kashmiri Zafrani Pulao',
        description: 'Long-grain basmati rice infused with pure Pampore saffron, topped with dried figs, apricots, walnuts, and caramelized onions.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 410,
        base_price: 260,
        selling_price: 225,
        tags: ['pulao', 'saffron', 'dry-fruits', 'rice'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden saffron scented pulao rice garnished with toasted dry fruits',
        imageTags: ['pulao', 'saffron', 'rice', 'kashmiri']
      },
      {
        name: 'Kashmiri Phirni',
        description: 'Ground rice pudding slow-set in traditional earthen sakoras, perfumed with saffron and slivered green pistachios.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 290,
        base_price: 130,
        selling_price: 110,
        tags: ['phirni', 'dessert', 'sakora', 'pudding'],
        catIndex: 1,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Silky smooth chilled phirni rice pudding in terracotta cup',
        imageTags: ['phirni', 'dessert', 'kashmiri', 'sweet']
      },
      {
        name: 'Pampore Saffron Kehwa',
        description: 'Traditional Kashmiri green tea brewed with whole cinnamon sticks, green cardamom pods, saffron strands, and crushed almonds.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 70,
        base_price: 90,
        selling_price: 79,
        tags: ['kehwa', 'tea', 'saffron', 'beverage'],
        catIndex: 2,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden aromatic Kashmiri kehwa tea in a clear glass with almond flakes',
        imageTags: ['kehwa', 'tea', 'kashmiri', 'herbal']
      }
    ]
  },
  {
    name: 'Goan Coastal Shack',
    description: 'Breezy Konkan and Portuguese inspired beachfront dining serving fresh ocean catches, kokum coolers, and coconut curries.',
    rating: 4.5,
    total_orders: 16800,
    location: {
      address: 'Miramar Beach Promenade, Near Circle',
      city: 'Panaji',
      state: 'Goa',
      country: 'India',
      pincode: '403001',
      latitude: 15.4868,
      longitude: 73.8078
    },
    delivery_time: { min: 30, max: 45 },
    cuisines: ['Coastal', 'Seafood', 'Goan'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Seafood Curries', 'Coastal Starters', 'Desserts & Drinks'],
    collectionNames: ['Catch of the Day', 'Goan Favorites'],
    foods: [
      {
        name: 'Goan Kingfish Curry',
        description: 'Fresh Surmai steaks simmered in fresh coconut milk, sour triphala, fiery dried Kashmiri chillies, and ginger.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 490,
        base_price: 420,
        selling_price: 369,
        tags: ['kingfish', 'curry', 'seafood', 'goan'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Tangy red coconut Kingfish curry served with steaming white rice',
        imageTags: ['fish-curry', 'goan', 'coastal', 'seafood']
      },
      {
        name: 'Goan Prawn Balchao',
        description: 'Plump ocean prawns pickled and cooked in a spicy, fiery, sweet-and-sour vinegar red masala with caramelized onions.',
        rating: 4.6,
        dietary_type: 'non_veg',
        calories: 380,
        base_price: 440,
        selling_price: 389,
        tags: ['prawns', 'balchao', 'spicy', 'tangy'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Fiery sweet and tangy Goan prawn balchao in ceramic dish',
        imageTags: ['prawns', 'balchao', 'seafood', 'goan']
      },
      {
        name: 'Rava Fried Surmai',
        description: 'Marinated kingfish steaks rolled in spiced semolina crumb and shallow-fried till crispy on cast iron skillet.',
        rating: 4.8,
        dietary_type: 'non_veg',
        calories: 360,
        base_price: 390,
        selling_price: 349,
        tags: ['rava-fry', 'fish-fry', 'crispy', 'starter'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden pan-fried semolina crusted fish slice with onion salad',
        imageTags: ['fish-fry', 'crispy', 'seafood', 'starter']
      },
      {
        name: 'Goan Chicken Xacuti',
        description: 'Tender chicken pieces cooked with roasted whole spices, white poppy seeds, and fresh grated desiccated coconut.',
        rating: 4.5,
        dietary_type: 'non_veg',
        calories: 510,
        base_price: 340,
        selling_price: 299,
        tags: ['chicken-xacuti', 'curry', 'roasted-spices', 'goan'],
        catIndex: 0,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Richly roasted brown coconut chicken Xacuti curry',
        imageTags: ['xacuti', 'chicken', 'curry', 'goan']
      },
      {
        name: 'Traditional Goan Bebinca',
        description: 'Classic seven-layered Indo-Portuguese pudding made from coconut milk, egg yolks, flour, sugar, and pure ghee.',
        rating: 4.6,
        dietary_type: 'egg',
        calories: 360,
        base_price: 160,
        selling_price: 139,
        tags: ['bebinca', 'dessert', 'pudding', 'layered'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Slice of authentic multi-layered Goan bebinca dessert cake',
        imageTags: ['bebinca', 'dessert', 'cake', 'goan']
      },
      {
        name: 'Kokum Sol Kadhi',
        description: 'Chilled tangy refreshing drink made from fresh coconut milk, dried kokum rinds, garlic cloves, and green chillies.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 90,
        base_price: 80,
        selling_price: 69,
        tags: ['sol-kadhi', 'kokum', 'digestive', 'refreshing'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Pink chilled coconut kokum sol kadhi in a highball glass',
        imageTags: ['sol-kadhi', 'drink', 'goan', 'beverage']
      }
    ]
  },
  {
    name: 'Nawab\'s Awadhi Dastarkhwan',
    description: 'Preserving the centuries-old royal culinary heritage of Lucknow Nawabs with slow dum cooking and fragrant essences.',
    rating: 4.7,
    total_orders: 26400,
    location: {
      address: '18 Tulsi Theatre Road, Hazratganj',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      country: 'India',
      pincode: '226001',
      latitude: 26.8467,
      longitude: 80.9462
    },
    delivery_time: { min: 30, max: 45 },
    cuisines: ['Awadhi', 'Mughlai', 'Kebabs'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Melt-in-Mouth Kebabs', 'Awadhi Gravies', 'Mughlai Breads & Kheer'],
    collectionNames: ['Nawabi Heritage', 'Signature Kebabs'],
    foods: [
      {
        name: 'Galouti Kebab with Paratha',
        description: 'Finely minced lamb patties infused with raw papaya and 160 secret spices, paired with melt-in-mouth Mughlai paratha.',
        rating: 4.9,
        dietary_type: 'non_veg',
        calories: 540,
        base_price: 380,
        selling_price: 329,
        tags: ['galouti', 'kebab', 'lamb', 'signature'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Tender Awadhi galouti kebab served on an inverted griddle paratha',
        imageTags: ['galouti', 'kebab', 'lucknow', 'meat']
      },
      {
        name: 'Kakori Mutton Seekh Kebab',
        description: 'Tender mutton seekh kebabs ground with saffron, rose petals, and marrow butter, chargrilled gently over sal wood charcoal.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 460,
        base_price: 390,
        selling_price: 349,
        tags: ['kakori', 'seekh-kebab', 'charcoal', 'starter'],
        catIndex: 0,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Skewered grilled mutton seekh kebabs with mint dip and onion rings',
        imageTags: ['seekh-kebab', 'kebab', 'mutton', 'grilled']
      },
      {
        name: 'Lucknowi Dum Gosht Biryani',
        description: 'Pakki biryani delicately prepared with mutton pieces simmered in yakhni stock, sealed in clay handi with kewra and meetha ittr.',
        rating: 4.8,
        dietary_type: 'non_veg',
        calories: 790,
        base_price: 430,
        selling_price: 379,
        tags: ['biryani', 'lucknowi', 'mutton', 'dum'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Fragrant light-colored Lucknowi mutton biryani in a handi',
        imageTags: ['biryani', 'lucknowi', 'gosht', 'rice']
      },
      {
        name: 'Mutton Nihari Kulcha',
        description: 'Shank meat slow-cooked overnight with bone marrow in fragrant flour-thickened stock, served with hot yeast kulcha.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 720,
        base_price: 450,
        selling_price: 399,
        tags: ['nihari', 'mutton', 'slow-cooked', 'bestseller'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Rich slow-cooked nihari gravy topped with julienned ginger and lemon',
        imageTags: ['nihari', 'mutton', 'curry', 'awadhi']
      },
      {
        name: 'Mughlai Sheermal',
        description: 'Traditional saffron-flavored sweet flatbread baked in clay oven, kneaded with milk and pure desi ghee.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 290,
        base_price: 90,
        selling_price: 79,
        tags: ['sheermal', 'bread', 'saffron', 'sweet'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden yellow sweet saffron sheermal flatbread freshly baked',
        imageTags: ['sheermal', 'bread', 'mughlai', 'saffron']
      },
      {
        name: 'Zafrani Shahi Kheer',
        description: 'Slow-simmered basmati rice pudding enriched with condensed milk, saffron strands, and roasted cashew halves.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 320,
        base_price: 140,
        selling_price: 119,
        tags: ['kheer', 'dessert', 'zafrani', 'sweet'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1563729784-fe03868a174a?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Creamy saffron scented rice kheer served in an earthen bowl',
        imageTags: ['kheer', 'dessert', 'sweet', 'pudding']
      }
    ]
  },
  {
    name: 'Trattoria Bella Napoli',
    description: 'Neapolitan style pizzeria and trattoria serving hand-stretched sourdough pizzas, fresh pasta, and decadent dolci.',
    rating: 4.6,
    total_orders: 19700,
    location: {
      address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560038',
      latitude: 12.9719,
      longitude: 77.6412
    },
    delivery_time: { min: 25, max: 40 },
    cuisines: ['Italian', 'Pizza', 'Pasta'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Woodfired Pizza', 'Artisan Pasta', 'Antipasti & Dolci'],
    collectionNames: ['Chef Italian Table', 'Pizza Lovers'],
    foods: [
      {
        name: 'Margherita Pizza Basilico',
        description: 'Fermented sourdough crust, San Marzano tomato sauce, fresh buffalo mozzarella, virgin olive oil, and fresh basil leaves.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 750,
        base_price: 390,
        selling_price: 349,
        tags: ['pizza', 'margherita', 'sourdough', 'italian'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Woodfired Neapolitan margherita pizza with melted buffalo mozzarella',
        imageTags: ['pizza', 'margherita', 'italian', 'cheesy']
      },
      {
        name: 'Truffle Wild Mushroom Risotto',
        description: 'Arborio rice slow-cooked with wild porcini mushrooms, parmesan reggiano shavings, and white truffle oil drizzle.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 580,
        base_price: 460,
        selling_price: 399,
        tags: ['risotto', 'truffle', 'mushrooms', 'creamy'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281861?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Creamy porcini mushroom risotto plated with shaved parmesan',
        imageTags: ['risotto', 'pasta', 'italian', 'truffle']
      },
      {
        name: 'Penne all\'Arrabbiata',
        description: 'Al dente bronze-cut penne pasta tossed in fiery garlic, ripe cherry tomatoes, red pepper flakes, and fresh basil.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 460,
        base_price: 320,
        selling_price: 279,
        tags: ['pasta', 'penne', 'arrabbiata', 'spicy'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Spicy penne arrabbiata pasta in red tomato sauce with basil leaf',
        imageTags: ['pasta', 'penne', 'arrabbiata', 'italian']
      },
      {
        name: 'Cheesy Garlic Herb Bread',
        description: 'Warm ciabatta baguette toasted with garlic herb butter, bubbling mozzarella cheese, and Italian oregano.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 340,
        base_price: 180,
        selling_price: 149,
        tags: ['garlic-bread', 'cheese', 'starter', 'crispy'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1506280754576-f6fa8a873550?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden toasted garlic bread loaded with pull-apart melted mozzarella',
        imageTags: ['garlic-bread', 'bread', 'cheese', 'antipasto']
      },
      {
        name: 'Classic Espresso Tiramisu',
        description: 'Layers of Italian Savoiardi ladyfinger biscuits dipped in fresh espresso, velvety mascarpone cream, and dark cocoa powder.',
        rating: 4.9,
        dietary_type: 'egg',
        calories: 420,
        base_price: 260,
        selling_price: 229,
        tags: ['tiramisu', 'dessert', 'coffee', 'sweet'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Decadent slice of coffee mascarpone tiramisu dusted with cocoa powder',
        imageTags: ['tiramisu', 'dessert', 'dolci', 'italian']
      },
      {
        name: 'Sicilian Mint Lemonade',
        description: 'Sparkling lemonade crafted with freshly squeezed Amalfi lemons, crushed mint leaves, and a dash of rock salt.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 120,
        base_price: 110,
        selling_price: 95,
        tags: ['lemonade', 'mocktail', 'beverage', 'sparkling'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Iced sparkling mint lemonade garnished with fresh lemon wheel',
        imageTags: ['lemonade', 'cooler', 'beverage', 'citrus']
      }
    ]
  },
  {
    name: 'Chai & Samosa Junction',
    description: 'Iconic bustling Mumbai street snack hub serving hot golden samosas, spicy vada pav, buttery pav bhaji, and kadak cutting chai.',
    rating: 4.4,
    total_orders: 39500,
    location: {
      address: 'Near Dadar Western Railway Station, Senapati Bapat Marg',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400028',
      latitude: 19.0178,
      longitude: 72.8478
    },
    delivery_time: { min: 15, max: 25 },
    cuisines: ['Fast Food', 'Snacks', 'Beverages'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Mumbai Street Food', 'Hot Snacks', 'Chai Specials'],
    collectionNames: ['Evening Snacks', 'Budget Bites'],
    foods: [
      {
        name: 'Mumbai Vada Pav (2 pcs)',
        description: 'Two spiced batter-fried potato batata vadas stuffed in fresh pav rolls with dry garlic red chutney and fried salted chillies.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 380,
        base_price: 70,
        selling_price: 59,
        tags: ['vada-pav', 'mumbai', 'street-food', 'snack'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Spicy Mumbai street-style batata vada pav served with red garlic chutney',
        imageTags: ['vada-pav', 'mumbai', 'street-food', 'fast-food']
      },
      {
        name: 'Samosa Chaat with Chole',
        description: 'Two crushed crisp potato samosas smothered under tangy tamarind chutney, spicy green chutney, and boiled chickpea curry.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 430,
        base_price: 120,
        selling_price: 99,
        tags: ['samosa-chaat', 'chaat', 'street-food', 'chole'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Crisp crushed samosa chaat topped with sev, pomegranate, and chutneys',
        imageTags: ['samosa-chaat', 'chaat', 'snack', 'indian-street-food']
      },
      {
        name: 'Butter Pav Bhaji',
        description: 'Mashed spicy mixed vegetable curry cooked on flat iron tawa with Amul butter, served with two toasted pav buns and onions.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 520,
        base_price: 170,
        selling_price: 145,
        tags: ['pav-bhaji', 'butter', 'mumbai', 'bestseller'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Rich butter pav bhaji platter with lemon wedges and diced red onions',
        imageTags: ['pav-bhaji', 'butter', 'mumbai', 'street-food']
      },
      {
        name: 'Bun Maska with Irani Chai',
        description: 'Soft sweet bakery bun stuffed with generous slabs of salted butter, paired with sweet and creamy cardamom tea.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 320,
        base_price: 90,
        selling_price: 79,
        tags: ['bun-maska', 'tea', 'mumbai', 'snack'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Warm toasted bun maska bread alongside a piping hot glass of tea',
        imageTags: ['bun-maska', 'breakfast', 'tea-snack', 'bread']
      },
      {
        name: 'Adrak Elaichi Masala Chai',
        description: 'Potent cutting chai brewed with freshly crushed ginger, green cardamom, whole spices, and thick sweetened milk.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 95,
        base_price: 45,
        selling_price: 39,
        tags: ['chai', 'masala-chai', 'ginger', 'hot-drink'],
        catIndex: 2,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Spiced hot Indian masala chai in a cutting glass tumbler',
        imageTags: ['chai', 'masala-chai', 'tea', 'beverage']
      },
      {
        name: 'Kanda Bhajji (Crispy Onion Pakoda)',
        description: 'Thinly sliced onions coated in spiced gram flour batter and fried into crunchy fritters, served with sweet-tangy dip.',
        rating: 4.4,
        dietary_type: 'veg',
        calories: 290,
        base_price: 85,
        selling_price: 69,
        tags: ['bhajji', 'pakoda', 'onion', 'crispy'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Hot crispy onion pakoda fritters stacked on parchment paper',
        imageTags: ['pakoda', 'bhaji', 'fritters', 'snack']
      }
    ]
  },
  {
    name: 'Sweet Bengal Confectionery',
    description: 'Master confectioners crafting hand-rolled Kolkata rasgullas, nolen gur sandesh, and velvety clay-pot mishti doi.',
    rating: 4.7,
    total_orders: 31800,
    location: {
      address: '78 College Street, Near Coffee House',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      pincode: '700073',
      latitude: 22.5739,
      longitude: 88.3639
    },
    delivery_time: { min: 20, max: 35 },
    cuisines: ['Desserts', 'Bengali', 'Sweets'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Traditional Sweets', 'Chhena Delicacies', 'Pudding & Yogurt'],
    collectionNames: ['Festive Favorites', 'Bengal Specials'],
    foods: [
      {
        name: 'Spongy Kolkata Rasgulla (4 pcs)',
        description: 'Fresh homemade chhena dumplings cooked in boiling light sugar syrup until cloud-like spongy and juicy.',
        rating: 4.9,
        dietary_type: 'veg',
        calories: 340,
        base_price: 140,
        selling_price: 119,
        tags: ['rasgulla', 'chhena', 'bengali', 'sweet'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Juicy white spongy rasgullas resting in clear sugar syrup',
        imageTags: ['rasgulla', 'sweet', 'dessert', 'bengali']
      },
      {
        name: 'Nolen Gur Sandesh',
        description: 'Seasonal artisanal confection made from fresh cow milk chhena blended with organic winter date palm jaggery.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 270,
        base_price: 160,
        selling_price: 139,
        tags: ['sandesh', 'nolen-gur', 'bengali', 'jaggery'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Artisanal molded date palm jaggery sandesh sweets',
        imageTags: ['sandesh', 'sweet', 'mithai', 'dessert']
      },
      {
        name: 'Kolkata Clay Pot Mishti Doi',
        description: 'Caramelized sweetened thick curd fermented traditionally in porous unglazed earthenware pots for earthen aroma.',
        rating: 4.9,
        dietary_type: 'veg',
        calories: 290,
        base_price: 120,
        selling_price: 99,
        tags: ['mishti-doi', 'curd', 'pot', 'bestseller'],
        catIndex: 2,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1563729784-fe03868a174a?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Creamy caramel mishti doi in traditional terracotta kulhad bowl',
        imageTags: ['mishti-doi', 'dessert', 'yogurt', 'sweet']
      },
      {
        name: 'Kaju Katli Diamond Box (250g)',
        description: 'Thin diamond-cut fudge sweets prepared from finest cashew nut paste and organic sugar, covered in silver vark.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 620,
        base_price: 320,
        selling_price: 289,
        tags: ['kaju-katli', 'cashew', 'festive', 'luxury'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Diamond cut silver-coated kaju katli sweets arranged in fan shape',
        imageTags: ['kaju-katli', 'sweets', 'mithai', 'cashew']
      },
      {
        name: 'Malai Cham Cham',
        description: 'Oval chhena sweets steeped in saffron rose syrup, slit open and filled with thick mawa malai cream and pistachio dust.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 360,
        base_price: 150,
        selling_price: 129,
        tags: ['cham-cham', 'malai', 'sweet', 'bengali'],
        catIndex: 1,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Stuffed malai cham cham sweets sprinkled with pistachio powder',
        imageTags: ['cham-cham', 'sweets', 'mithai', 'dessert']
      },
      {
        name: 'Kesari Rabri with Dry Fruits',
        description: 'Slowly thickened condensed buffalo milk layered with malai flakes, scented with saffron, cardamom, and almond slivers.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 410,
        base_price: 170,
        selling_price: 149,
        tags: ['rabri', 'malai', 'saffron', 'dry-fruits'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Rich flaky kesari rabri served in clay bowl with pistachio slivers',
        imageTags: ['rabri', 'dessert', 'sweet', 'malai']
      }
    ]
  },
  {
    name: 'Andhra Spice Kitchen',
    description: 'Fiery and flavorful Andhra culinary feast featuring fiery gun-powder podis, tangy gongura gravies, and coastal roasts.',
    rating: 4.5,
    total_orders: 22900,
    location: {
      address: 'Shop 12, Besant Road, Governorpet',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      country: 'India',
      pincode: '520002',
      latitude: 16.5131,
      longitude: 80.6325
    },
    delivery_time: { min: 25, max: 40 },
    cuisines: ['Andhra', 'South Indian', 'Spicy'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Spicy Starters', 'Traditional Curries', 'Rice Combos & Drinks'],
    collectionNames: ['Fiery Andhra Treats', 'Lunch Specials'],
    foods: [
      {
        name: 'Andhra Gongura Chicken Curry',
        description: 'Tender country chicken simmered in tangy red sorrel (gongura) leaves, Guntur chillies, and garlic cloves.',
        rating: 4.8,
        dietary_type: 'non_veg',
        calories: 560,
        base_price: 340,
        selling_price: 299,
        tags: ['gongura', 'chicken', 'andhra', 'spicy'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Deep green and red fiery Andhra Gongura chicken curry bowl',
        imageTags: ['gongura', 'chicken', 'curry', 'andhra']
      },
      {
        name: 'Andhra Style Kodi Vepudu',
        description: 'Chicken bone-in pieces dry-roasted on iron skillet with crushed peppercorns, roasted coriander seeds, and fried curry leaves.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 490,
        base_price: 320,
        selling_price: 279,
        tags: ['kodi-vepudu', 'chicken-fry', 'spicy', 'starter'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Dark spicy dry-roasted Andhra chicken fry with green chillies',
        imageTags: ['chicken-fry', 'andhra', 'spicy', 'starter']
      },
      {
        name: 'Royyala Iguru (Prawn Fry)',
        description: 'Juicy coastal prawns slow-cooked in thick caramelized onion-tomato paste, crushed black pepper, and ginger garlic paste.',
        rating: 4.6,
        dietary_type: 'non_veg',
        calories: 430,
        base_price: 390,
        selling_price: 349,
        tags: ['prawns', 'iguru', 'seafood', 'spicy'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Spicy caramelized Andhra prawn fry with fresh cilantro sprigs',
        imageTags: ['prawns', 'iguru', 'seafood', 'andhra']
      },
      {
        name: 'Andhra Chilli Paneer',
        description: 'Soft cottage cheese cubes tossed in pungent green chilli paste, curry leaf tadka, cumin, and cracked coriander seeds.',
        rating: 4.4,
        dietary_type: 'veg',
        calories: 370,
        base_price: 260,
        selling_price: 229,
        tags: ['paneer', 'chilli-paneer', 'vegetarian', 'spicy'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Spicy tossed Andhra style green chili paneer cubes',
        imageTags: ['paneer', 'vegetarian', 'spicy', 'starter']
      },
      {
        name: 'Tomato Pappu with Steamed Rice & Ghee',
        description: 'Homestyle Andhra toor dal cooked with ripe country tomatoes, tamarind, and garlic, served with hot rice and melting desi ghee.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 480,
        base_price: 180,
        selling_price: 149,
        tags: ['pappu', 'dal', 'comfort-food', 'rice-combo'],
        catIndex: 2,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Comforting yellow tomato dal served over a bed of warm steamed rice',
        imageTags: ['dal', 'rice', 'pappu', 'andhra']
      },
      {
        name: 'Spiced Masala Majjiga (Buttermilk)',
        description: 'Churned thin buttermilk blended with grated ginger, crushed green chillies, fresh coriander, asafoetida, and rock salt.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 85,
        base_price: 50,
        selling_price: 39,
        tags: ['buttermilk', 'majjiga', 'cooling', 'beverage'],
        catIndex: 2,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Refreshing spiced buttermilk served chilled with mint garnish',
        imageTags: ['buttermilk', 'majjiga', 'drink', 'beverage']
      }
    ]
  },
  {
    name: 'The Burger Garage',
    description: 'American style gourmet diner handcrafting smashed patty burgers, crispy tenders, seasoned fries, and malt shakes.',
    rating: 4.4,
    total_orders: 27600,
    location: {
      address: '80 Feet Road, 4th Block, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560034',
      latitude: 12.9352,
      longitude: 77.6245
    },
    delivery_time: { min: 20, max: 35 },
    cuisines: ['Fast Food', 'Burgers', 'American'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Gourmet Burgers', 'Sides & Munchies', 'Thick Shakes'],
    collectionNames: ['Top Buns', 'Combo Meals'],
    foods: [
      {
        name: 'Crispy Peri Peri Chicken Burger',
        description: 'Double-breaded golden chicken breast patty dusted in spicy Peri Peri rub, melted cheddar cheese, shredded lettuce, and chipotle mayo.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 620,
        base_price: 270,
        selling_price: 229,
        tags: ['burger', 'chicken-burger', 'peri-peri', 'crispy'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Towering crispy chicken burger stacked with cheese and lettuce in brioche bun',
        imageTags: ['burger', 'chicken-burger', 'fast-food', 'cheddar']
      },
      {
        name: 'Double Smash Cheeseburger',
        description: 'Two smashed beef-style mutton patties seared on cast iron flat top with caramelized onions, American cheddar slices, and house burger sauce.',
        rating: 4.6,
        dietary_type: 'non_veg',
        calories: 740,
        base_price: 340,
        selling_price: 299,
        tags: ['burger', 'cheeseburger', 'smash-patty', 'bestseller'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Juicy double smash cheeseburger with melted cheddar dripping down',
        imageTags: ['burger', 'cheeseburger', 'american', 'gourmet']
      },
      {
        name: 'Smoky BBQ Paneer Burger',
        description: 'Grilled cottage cheese steak glazed in hickory barbecue sauce, layered with crispy onion rings, dill pickles, and garlic aioli.',
        rating: 4.4,
        dietary_type: 'veg',
        calories: 530,
        base_price: 230,
        selling_price: 199,
        tags: ['burger', 'paneer-burger', 'bbq', 'vegetarian'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Barbecue grilled paneer burger with lettuce in sesame seed bun',
        imageTags: ['burger', 'paneer', 'veggie-burger', 'bbq']
      },
      {
        name: 'Peri Peri French Fries',
        description: 'Skin-on golden potato fries tossed in zesty African bird\'s eye chilli spice blend, served with garlic herb mayo.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 330,
        base_price: 140,
        selling_price: 119,
        tags: ['fries', 'peri-peri', 'potato', 'side'],
        catIndex: 1,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Basket of crisp french fries dusted with vibrant peri peri spice',
        imageTags: ['fries', 'french-fries', 'side', 'crispy']
      },
      {
        name: 'Golden Fried Onion Rings',
        description: 'Thick white onion rings dipped in seasoned beer batter and panko breadcrumbs, fried till crunchy, served with cocktail dip.',
        rating: 4.3,
        dietary_type: 'veg',
        calories: 280,
        base_price: 150,
        selling_price: 129,
        tags: ['onion-rings', 'sides', 'crispy', 'snack'],
        catIndex: 1,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Stack of crunchy golden fried onion rings with dipping sauce',
        imageTags: ['onion-rings', 'appetizer', 'crispy', 'fast-food']
      },
      {
        name: 'Belgian Dark Chocolate Shake',
        description: 'Thick rich milkshake blended with Belgian 54% dark chocolate ganache, vanilla ice cream, and chocolate curls.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 480,
        base_price: 190,
        selling_price: 169,
        tags: ['milkshake', 'chocolate', 'shake', 'dessert'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Decadent dark chocolate milkshake topped with whipped cream and syrup',
        imageTags: ['shake', 'chocolate-shake', 'dessert', 'beverage']
      }
    ]
  },
  {
    name: 'Kerala Malabar Delights',
    description: 'Traditional Mappila and coastal culinary legacy featuring fragrant kaima rice biryanis, coconut milk fish stews, and flaky parottas.',
    rating: 4.6,
    total_orders: 17900,
    location: {
      address: 'Tower Road, Near Chinese Fishing Nets, Fort Kochi',
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      pincode: '682001',
      latitude: 9.9656,
      longitude: 76.2421
    },
    delivery_time: { min: 25, max: 40 },
    cuisines: ['Kerala', 'Malabar', 'South Indian'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Malabar Curries & Biryani', 'Tiffin & Bread', 'Beverages & Treats'],
    collectionNames: ['Malabar Heritage', 'Kerala Seafood'],
    foods: [
      {
        name: 'Thalassery Chicken Dum Biryani',
        description: 'Fragrant short-grain Kaima rice cooked with tender chicken, ghee, fried shallots, cashews, and golden sultanas in dum style.',
        rating: 4.8,
        dietary_type: 'non_veg',
        calories: 730,
        base_price: 310,
        selling_price: 269,
        tags: ['thalassery', 'biryani', 'malabar', 'chicken'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Authentic Thalassery chicken biryani garnished with raisins and cashews',
        imageTags: ['biryani', 'thalassery', 'malabar', 'chicken']
      },
      {
        name: 'Kerala Parotta with Chicken Roast',
        description: 'Two flaky layered spiral parottas served with semi-dry country chicken roasted with caramelized shallots and crushed pepper.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 610,
        base_price: 270,
        selling_price: 235,
        tags: ['parotta', 'chicken-roast', 'malabar', 'bestseller'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Crispy flaky Kerala parotta paired with dark spicy chicken roast gravy',
        imageTags: ['parotta', 'chicken-roast', 'kerala', 'spicy']
      },
      {
        name: 'Kerala Fish Moilee',
        description: 'Kingfish steak poached gently in rich coconut milk broth flavored with green chillies, curry leaves, ginger, and turmeric.',
        rating: 4.7,
        dietary_type: 'non_veg',
        calories: 460,
        base_price: 390,
        selling_price: 349,
        tags: ['fish-moilee', 'seafood', 'coconut-milk', 'mild'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Aromatic yellow coconut milk Fish Moilee curry with tomato wedges',
        imageTags: ['fish-moilee', 'seafood', 'kerala', 'curry']
      },
      {
        name: 'Kerala Vegetable Stew with Appam',
        description: 'Gentle medley of potatoes, carrots, and green peas simmered in spiced coconut milk, paired with two soft lacy appams.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 320,
        base_price: 210,
        selling_price: 179,
        tags: ['stew', 'appam', 'coconut-milk', 'vegetarian'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Creamy vegetable stew in coconut milk served alongside soft appam',
        imageTags: ['vegetable-stew', 'appam', 'kerala', 'mild']
      },
      {
        name: 'Pazham Pori (Banana Fritters)',
        description: 'Ripe sweet Nendran banana slices dipped in turmeric cardamom flour batter and deep fried to golden perfection.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 240,
        base_price: 80,
        selling_price: 69,
        tags: ['pazham-pori', 'banana', 'fritters', 'snack'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Golden brown Kerala banana fritters served hot on banana leaf',
        imageTags: ['pazham-pori', 'banana-fritters', 'kerala', 'snack']
      },
      {
        name: 'Elaneer Tender Coconut Shake',
        description: 'Blended fresh tender coconut water and soft coconut malai pulp with chilled milk and a hint of vanilla.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 190,
        base_price: 120,
        selling_price: 99,
        tags: ['tender-coconut', 'shake', 'refreshing', 'beverage'],
        catIndex: 2,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Creamy cold tender coconut shake in a tall glass with coconut shavings',
        imageTags: ['coconut-shake', 'elaneer', 'beverage', 'tropical']
      }
    ]
  },
  {
    name: 'Rajdhani Thali Samrat',
    description: 'Lavish royal vegetarian culinary journey through Rajasthan and Gujarat featuring traditional thali specialties and artisanal ghee sweets.',
    rating: 4.5,
    total_orders: 19200,
    location: {
      address: 'Opposite Town Hall, Ashram Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      pincode: '380006',
      latitude: 23.0225,
      longitude: 72.5714
    },
    delivery_time: { min: 30, max: 45 },
    cuisines: ['Rajasthani', 'Gujarati', 'North Indian'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Royal Thali Items', 'Regional Specialties', 'Snacks & Sweets'],
    collectionNames: ['Thali Delights', 'Royal Rajasthani'],
    foods: [
      {
        name: 'Traditional Dal Baati Churma',
        description: 'Hard baked wheat baatis soaked in pure desi ghee, served with five-lentil spicy panchmel dal and sweet powdered jaggery churma.',
        rating: 4.9,
        dietary_type: 'veg',
        calories: 720,
        base_price: 340,
        selling_price: 299,
        tags: ['dal-baati', 'rajasthani', 'ghee', 'signature'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Traditional Rajasthani thali platter with crushed baati, dal, and churma',
        imageTags: ['dal-baati', 'rajasthani', 'thali', 'ghee']
      },
      {
        name: 'Rajasthani Gatte Ki Sabzi',
        description: 'Steamed gram flour dumplings simmered in a spiced tangy yogurt and asafoetida gravy tempered with mustard seeds.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 390,
        base_price: 240,
        selling_price: 209,
        tags: ['gatte-ki-sabzi', 'besan', 'curry', 'rajasthani'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Savory besan gatta dumplings in spiced yogurt curry',
        imageTags: ['gatte-ki-sabzi', 'curry', 'rajasthani', 'vegetarian']
      },
      {
        name: 'Paneer Butter Masala Mewari Style',
        description: 'Fresh paneer cubes cooked in a royal Mewari gravy of cashew nuts, melon seeds, tomatoes, and aromatic whole spices.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 510,
        base_price: 290,
        selling_price: 249,
        tags: ['paneer', 'paneer-butter-masala', 'curry', 'royal'],
        catIndex: 1,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Creamy orange paneer butter masala curry with fresh coriander garnish',
        imageTags: ['paneer', 'curry', 'mewari', 'butter-masala']
      },
      {
        name: 'Gujarati Nylon Khaman Dhokla (4 pcs)',
        description: 'Steamed fermented chickpea flour cakes, light, spongy, tempered with mustard seeds, green chillies, and fresh grated coconut.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 210,
        base_price: 110,
        selling_price: 89,
        tags: ['dhokla', 'khaman', 'gujarati', 'snack'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Spongy yellow Gujarati khaman dhokla squares with mustard green chili tadka',
        imageTags: ['dhokla', 'gujarati', 'khaman', 'snack']
      },
      {
        name: 'Ker Sangri Marwadi Delicacy',
        description: 'Exotic desert berry and dried wild bean preparation cooked with dry mango powder, raisins, and aromatic Marwadi spices.',
        rating: 4.5,
        dietary_type: 'veg',
        calories: 340,
        base_price: 280,
        selling_price: 239,
        tags: ['ker-sangri', 'marwadi', 'traditional', 'desert-dish'],
        catIndex: 1,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Authentic Marwadi Ker Sangri dry preparation in bronze katori',
        imageTags: ['ker-sangri', 'rajasthani', 'traditional', 'delicacy']
      },
      {
        name: 'Kesar Mango Lassi',
        description: 'Thick churned sweet yogurt drink blended with Gujarat Kesar mango pulp and garnished with saffron and cardamom powder.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 260,
        base_price: 110,
        selling_price: 95,
        tags: ['mango-lassi', 'lassi', 'mango', 'beverage'],
        catIndex: 2,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Frothy yellow sweet mango lassi in clay tumbler with saffron strands',
        imageTags: ['mango-lassi', 'lassi', 'beverage', 'yogurt']
      }
    ]
  },
  {
    name: 'Madras Filter Kaapi & Tiffin',
    description: 'Iconic Mylapore breakfast joint celebrated for piping hot button idlis, crispy rava dosas, and invigorating degree coffee.',
    rating: 4.7,
    total_orders: 33100,
    location: {
      address: '45 North Mada Street, Near Kapaleeshwarar Temple, Mylapore',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600004',
      latitude: 13.0334,
      longitude: 80.2694
    },
    delivery_time: { min: 15, max: 30 },
    cuisines: ['South Indian', 'Beverages', 'Fast Food'],
    disclaimer: 'Images are for representation purposes only.',
    is_active: true,
    categoryNames: ['Breakfast Specials', 'Dosa Corner', 'Traditional Drinks & Sweets'],
    collectionNames: ['Mylapore Mornings', 'Quick Breakfast'],
    foods: [
      {
        name: 'Ghee Podi Button Idli (14 mini pcs)',
        description: 'Fourteen bite-sized steamed mini idlis tossed generously in fiery gun-powder podi and hot melted desi ghee.',
        rating: 4.9,
        dietary_type: 'veg',
        calories: 290,
        base_price: 120,
        selling_price: 99,
        tags: ['podi-idli', 'ghee', 'breakfast', 'tiffin'],
        catIndex: 0,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Mini button idlis drenched in spiced red podi and glistening desi ghee',
        imageTags: ['podi-idli', 'idli', 'south-indian', 'ghee']
      },
      {
        name: 'Crispy Onion Rava Dosa',
        description: 'Lacy, crackling semolina crepe studded with chopped red onions, green chillies, cracked black pepper, and fresh cumin.',
        rating: 4.7,
        dietary_type: 'veg',
        calories: 380,
        base_price: 140,
        selling_price: 119,
        tags: ['rava-dosa', 'dosa', 'crispy', 'breakfast'],
        catIndex: 1,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Crisp lacy onion rava dosa with coconut and tomato chutneys',
        imageTags: ['rava-dosa', 'dosa', 'breakfast', 'south-indian']
      },
      {
        name: 'Onion Tomato Uttapam',
        description: 'Thick fluffy fermented rice-lentil pancake griddled with finely chopped red onions, ripe tomatoes, curry leaves, and green chillies.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 330,
        base_price: 130,
        selling_price: 109,
        tags: ['uttapam', 'tiffin', 'vegetarian', 'onion-tomato'],
        catIndex: 1,
        colIndices: [1],
        imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Thick golden uttapam topped with charred onions and diced tomatoes',
        imageTags: ['uttapam', 'south-indian', 'breakfast', 'tiffin']
      },
      {
        name: 'Poori Masala (3 pcs)',
        description: 'Puffy deep-fried golden wheat pooris served with South Indian spiced potato onion sagu masala and coconut chutney.',
        rating: 4.6,
        dietary_type: 'veg',
        calories: 420,
        base_price: 120,
        selling_price: 99,
        tags: ['poori', 'poori-masala', 'breakfast', 'comfort-food'],
        catIndex: 0,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Three puffed golden pooris served with yellow potato masala curry',
        imageTags: ['poori', 'breakfast', 'poori-masala', 'indian']
      },
      {
        name: 'Kumbakonam Degree Coffee',
        description: 'Authentic pure cow milk degree coffee brewed from freshly roasted chicory beans, served piping hot and frothy in bronze davarah.',
        rating: 4.9,
        dietary_type: 'veg',
        calories: 95,
        base_price: 50,
        selling_price: 40,
        tags: ['degree-coffee', 'kaapi', 'coffee', 'bestseller'],
        catIndex: 2,
        colIndices: [0, 1],
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Frothy hot Kumbakonam degree filter coffee in traditional brass set',
        imageTags: ['coffee', 'filter-coffee', 'degree-coffee', 'kaapi']
      },
      {
        name: 'Ghee Sakkarai Pongal',
        description: 'Sweet jaggery rice pudding prepared with new harvest rice, yellow moong dal, roasted cashews, and generous melted cow ghee.',
        rating: 4.8,
        dietary_type: 'veg',
        calories: 340,
        base_price: 90,
        selling_price: 75,
        tags: ['pongal', 'sakkarai-pongal', 'sweet', 'ghee'],
        catIndex: 2,
        colIndices: [0],
        imageUrl: 'https://images.unsplash.com/photo-1563729784-fe03868a174a?auto=format&fit=crop&w=800&q=80',
        imageDesc: 'Glistening sweet Sakkarai Pongal enriched with ghee and cashews',
        imageTags: ['pongal', 'sakkarai-pongal', 'sweet', 'dessert']
      }
    ]
  }
];

export function generateDatasets() {
  const images = [];
  const foodItems = [];
  const restaurants = [];

  // Generate 16 restaurant entities and their images first
  restaurantsData.forEach((rRaw, rIndex) => {
    const restaurantId = crypto.randomUUID();
    const bannerImageId = crypto.randomUUID();

    // Banner image for restaurant
    const photo = restaurantPhotos[rIndex];
    images.push({
      id: bannerImageId,
      image_url: photo.url,
      description: photo.desc,
      type: 'banner',
      tags: photo.tags
    });

    // Create categories
    const categories = rRaw.categoryNames.map(name => ({
      id: crypto.randomUUID(),
      name,
      food_ids: []
    }));

    // Create collections
    const collections = rRaw.collectionNames.map(name => ({
      id: crypto.randomUUID(),
      name,
      food_ids: []
    }));

    // Generate foods for this restaurant
    rRaw.foods.forEach(fRaw => {
      const foodId = crypto.randomUUID();
      const foodImageId = crypto.randomUUID();

      images.push({
        id: foodImageId,
        image_url: fRaw.imageUrl,
        description: fRaw.imageDesc,
        type: 'food',
        tags: fRaw.imageTags
      });

      const foodItem = {
        id: foodId,
        restaurant_id: restaurantId,
        name: fRaw.name,
        image_id: foodImageId,
        description: fRaw.description,
        rating: fRaw.rating,
        dietary_type: fRaw.dietary_type,
        nutrition: {
          calories: fRaw.calories
        },
        pricing: [
          {
            currency: 'INR',
            base_price: fRaw.base_price,
            selling_price: fRaw.selling_price
          }
        ],
        tags: fRaw.tags,
        is_active: true
      };

      foodItems.push(foodItem);

      // Add to category
      if (categories[fRaw.catIndex]) {
        categories[fRaw.catIndex].food_ids.push(foodId);
      }

      // Add to collections
      fRaw.colIndices.forEach(colIdx => {
        if (collections[colIdx]) {
          collections[colIdx].food_ids.push(foodId);
        }
      });
    });

    // Restaurant record
    const restaurant = {
      id: restaurantId,
      name: rRaw.name,
      description: rRaw.description,
      rating: rRaw.rating,
      total_orders: rRaw.total_orders,
      location: rRaw.location,
      delivery_time: rRaw.delivery_time,
      cuisines: rRaw.cuisines,
      menu_categories: categories,
      collections: collections,
      disclaimer: rRaw.disclaimer,
      is_active: rRaw.is_active
    };

    restaurants.push(restaurant);
  });

  return {
    imagesDataset: {
      timestamp: {
        updated_at: TIMESTAMP_UTC
      },
      data: images
    },
    foodsDataset: {
      timestamp: {
        updated_at: TIMESTAMP_UTC
      },
      data: foodItems
    },
    restaurantsDataset: {
      timestamp: {
        updated_at: TIMESTAMP_UTC
      },
      data: restaurants
    }
  };
}

// Write to files if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { imagesDataset, foodsDataset, restaurantsDataset } = generateDatasets();

  fs.writeFileSync(
    path.join(dataDir, 'restaurant-images.json'),
    JSON.stringify(imagesDataset, null, 2) + '\n',
    'utf-8'
  );

  fs.writeFileSync(
    path.join(dataDir, 'food-items.json'),
    JSON.stringify(foodsDataset, null, 2) + '\n',
    'utf-8'
  );

  fs.writeFileSync(
    path.join(dataDir, 'restaurants.json'),
    JSON.stringify(restaurantsDataset, null, 2) + '\n',
    'utf-8'
  );

  console.log('Datasets successfully generated:');
  console.log(`- Restaurants: ${restaurantsDataset.data.length}`);
  console.log(`- Food Items: ${foodsDataset.data.length}`);
  console.log(`- Images: ${imagesDataset.data.length}`);
}
