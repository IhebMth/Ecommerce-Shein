const PRODUCTS = [
  {
    id: 'acc-001',
    name: { en: 'Golden Chain Necklace', ar: 'قلادة سلسلة ذهبية' },
    category: 'Accessories',
    price: 29.99, oldPrice: 49.99,
    desc: {
      en: 'Elegant 18k gold-plated chain necklace, perfect for layering. Hypoallergenic and tarnish-resistant.',
      ar: 'قلادة سلسلة أنيقة مطلية بالذهب عيار 18، مثالية للتطبيق. مضادة للحساسية ومقاومة للتآكل.'
    },
    colors: [
      { name: { en: 'Gold', ar: 'ذهبي' }, hex: '#D4AF37', images: [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600',
        'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600',
        'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600'
      ]},
      { name: { en: 'Silver', ar: 'فضي' }, hex: '#C0C0C0', images: [
        'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',
        'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600'
      ]},
      { name: { en: 'Rose Gold', ar: 'ذهب وردي' }, hex: '#B76E79', images: [
        'https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=600',
        'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=600'
      ]}
    ],
    sizes: ['One Size'], stock: 12
  },
  {
    id: 'acc-002',
    name: { en: 'Silk Hair Scrunchie Set', ar: 'طقم ربطات شعر حريرية' },
    category: 'Accessories',
    price: 14.99, oldPrice: null,
    desc: {
      en: 'Set of 5 pure silk scrunchies in neutral tones. Gentle on hair, stunning on wrist.',
      ar: 'طقم من 5 ربطات شعر حريرية بألوان محايدة. لطيفة على الشعر، رائعة على المعصم.'
    },
    colors: [
      { name: { en: 'Neutral Mix', ar: 'ألوان محايدة' }, hex: null, multi: true, images: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
        'https://images.unsplash.com/photo-1595152772835-219674b2a163?w=600',
        'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600'
      ]},
      { name: { en: 'Blush Pink', ar: 'وردي فاتح' }, hex: '#F4A7B9', images: [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600'
      ]},
      { name: { en: 'Ivory', ar: 'عاجي' }, hex: '#FFFFF0', images: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600',
        'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600'
      ]},
      { name: { en: 'Black', ar: 'أسود' }, hex: '#1a1a1a', images: [
        'https://images.unsplash.com/photo-1583692331507-fc0bd348695d?w=600',
        'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600'
      ]}
    ],
    sizes: ['One Size'], stock: 3
  },
  {
    id: 'shoes-001',
    name: { en: 'Classic White Sneakers', ar: 'حذاء رياضي أبيض كلاسيكي' },
    category: 'Shoes',
    price: 89.99, oldPrice: 119.99,
    desc: {
      en: 'Minimalist leather sneakers with cushioned insole. A wardrobe staple for any outfit.',
      ar: 'حذاء رياضي جلدي بسيط بنعل داخلي مبطن. أساسي في أي خزانة ملابس.'
    },
    colors: [
      { name: { en: 'White', ar: 'أبيض' }, hex: '#F5F5F5', images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600',
        'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600'
      ]},
      { name: { en: 'Black', ar: 'أسود' }, hex: '#1a1a1a', images: [
        'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600',
        'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600'
      ]},
      { name: { en: 'Beige', ar: 'بيج' }, hex: '#C9B99A', images: [
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600',
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600'
      ]}
    ],
    sizes: ['36','37','38','39','40','41','42'], stock: 18,
    sizeStock: { '36':2,'37':3,'38':4,'39':0,'40':3,'41':4,'42':2 }
  },
  {
    id: 'shoes-002',
    name: { en: 'Strappy Heeled Sandals', ar: 'صندل بكعب وأحزمة' },
    category: 'Shoes',
    price: 64.99, oldPrice: null,
    desc: {
      en: 'Elegant square-toe heeled sandals with adjustable ankle strap. 6cm heel.',
      ar: 'صندل أنيق مربع الرأس بكعب وحزام كاحل قابل للتعديل. كعب 6 سم.'
    },
    colors: [
      { name: { en: 'Nude', ar: 'بيج داكن' }, hex: '#C9A98B', images: [
        'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600',
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'
      ]},
      { name: { en: 'Black', ar: 'أسود' }, hex: '#1a1a1a', images: [
        'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=600',
        'https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?w=600'
      ]}
    ],
    sizes: ['36','37','38','39','40','41'], stock: 0
  },
  {
    id: 'leg-001',
    name: { en: 'High-Waist Power Leggings', ar: 'لغنز ضاغط بخصر عالٍ' },
    category: 'Leggings',
    price: 44.99, oldPrice: 59.99,
    desc: {
      en: 'Compression leggings with squat-proof fabric. 4-way stretch, moisture-wicking technology.',
      ar: 'لغنز ضاغط بقماش مقاوم لتمارين السكوات. 4 اتجاهات تمدد، تقنية امتصاص الرطوبة.'
    },
    colors: [
      { name: { en: 'Black', ar: 'أسود' }, hex: '#1a1a1a', images: [
        'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600',
        'https://images.unsplash.com/photo-1535530124196-70d5b50a5a4e?w=600'
      ]},
      { name: { en: 'Navy', ar: 'كحلي' }, hex: '#1B3A6B', images: [
        'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=600',
        'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600'
      ]},
      { name: { en: 'Sage Green', ar: 'أخضر مائل' }, hex: '#8FAF8F', images: [
        'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600',
        'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600'
      ]},
      { name: { en: 'Burgundy', ar: 'أحمر غامق' }, hex: '#722F37', images: [
        'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600',
        'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600'
      ]}
    ],
    sizes: ['XS','S','M','L','XL'], stock: 22
  },
  {
    id: 'leg-002',
    name: { en: 'Flare Lounge Pants', ar: 'بنطال فضفاض مضيء' },
    category: 'Leggings',
    price: 39.99, oldPrice: null,
    desc: {
      en: 'Buttery-soft flare leggings. Perfect for yoga, pilates, or everyday comfort.',
      ar: 'لغنز ناعم جداً بقصة واسعة. مثالي لليوغا والبيلاتس أو الراحة اليومية.'
    },
    colors: [
      { name: { en: 'Camel', ar: 'جمل' }, hex: '#C19A6B', images: [
        'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600',
        'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600'
      ]},
      { name: { en: 'Black', ar: 'أسود' }, hex: '#1a1a1a', images: [
        'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600',
        'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600'
      ]},
      { name: { en: 'Lavender', ar: 'بنفسجي فاتح' }, hex: '#B57EDC', images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600'
      ]}
    ],
    sizes: ['XS','S','M','L','XL','XXL'], stock: 8
  },
  {
    id: 'tshirt-001',
    name: { en: 'Essential Crop Tee', ar: 'تيشيرت كروب أساسي' },
    category: 'T-Shirts',
    price: 24.99, oldPrice: 34.99,
    desc: {
      en: '100% organic cotton cropped t-shirt. Relaxed fit with raw hem detail.',
      ar: 'تيشيرت مقصوص من قطن عضوي 100%. قصة مريحة مع حافة خام.'
    },
    colors: [
      { name: { en: 'White', ar: 'أبيض' }, hex: '#F5F5F5', images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600'
      ]},
      { name: { en: 'Black', ar: 'أسود' }, hex: '#1a1a1a', images: [
        'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600',
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600'
      ]},
      { name: { en: 'Dusty Rose', ar: 'وردي غبار' }, hex: '#DCAE96', images: [
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600'
      ]},
      { name: { en: 'Sage', ar: 'أخضر ميرمية' }, hex: '#8FAF8F', images: [
        'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600'
      ]}
    ],
    sizes: ['XS','S','M','L','XL'], stock: 15,
    sizeStock: { 'XS':1,'S':3,'M':5,'L':4,'XL':2 }
  },
  {
    id: 'tshirt-002',
    name: { en: 'Oversized Graphic Tee', ar: 'تيشيرت واسع بطباعة' },
    category: 'T-Shirts',
    price: 32.99, oldPrice: null,
    desc: {
      en: 'Bold graphic print on ultra-soft jersey fabric. Drop-shoulder boxy fit.',
      ar: 'طباعة جريئة على قماش جيرسي ناعم جداً. قصة مربعة بكتفين محدرتين.'
    },
    colors: [
      { name: { en: 'Washed Black', ar: 'أسود مغسول' }, hex: '#2a2a2a', images: [
        'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'
      ]},
      { name: { en: 'Off White', ar: 'أبيض مكسور' }, hex: '#FAF9F6', images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600'
      ]},
      { name: { en: 'Stone Blue', ar: 'أزرق رمادي' }, hex: '#6B8CAE', images: [
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600',
        'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600'
      ]}
    ],
    sizes: ['S','M','L','XL','XXL'], stock: 5
  },
  {
    id: 'arm-001',
    name: { en: 'UV Protection Arm Sleeves', ar: 'كمام واقية من الأشعة فوق البنفسجية' },
    category: 'Arm Sleeves',
    price: 18.99, oldPrice: 24.99,
    desc: {
      en: 'UPF 50+ arm sleeves for outdoor activities. Breathable, anti-slip, available in pairs.',
      ar: 'كمام UPF 50+ للأنشطة الخارجية. قابلة للتهوية، مضادة للانزلاق، تُباع بالزوج.'
    },
    colors: [
      { name: { en: 'Black', ar: 'أسود' }, hex: '#1a1a1a', images: [
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600'
      ]},
      { name: { en: 'White', ar: 'أبيض' }, hex: '#F5F5F5', images: [
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600',
        'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=600'
      ]},
      { name: { en: 'Navy', ar: 'كحلي' }, hex: '#1B3A6B', images: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'
      ]}
    ],
    sizes: ['S/M','M/L','L/XL'], stock: 20
  },
  {
    id: 'arm-002',
    name: { en: 'Compression Sports Sleeves', ar: 'كمام رياضية ضاغطة' },
    category: 'Arm Sleeves',
    price: 22.99, oldPrice: null,
    desc: {
      en: 'Graduated compression sleeves for performance and recovery. Sold as a pair.',
      ar: 'كمام ضغط تدريجي للأداء والتعافي. تُباع بالزوج.'
    },
    colors: [
      { name: { en: 'Charcoal', ar: 'رمادي داكن' }, hex: '#3a3a3a', images: [
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600',
        'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=600'
      ]},
      { name: { en: 'Electric Blue', ar: 'أزرق كهربائي' }, hex: '#0047AB', images: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600'
      ]},
      { name: { en: 'Red', ar: 'أحمر' }, hex: '#B22222', images: [
        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600',
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600'
      ]}
    ],
    sizes: ['XS','S','M','L','XL'], stock: 9
  }
];