// Mock data for Per's Restaurant
// Categories, menu items, user (LINE), order history

window.RESTAURANT = {
  name: "Per's Kitchen",
  nameTh: "ครัวของเปอร์",
  tagline: "อาหารไทยต้นตำรับ ทำสด ทุกจาน",
  table: 5,
};

window.LINE_USER = {
  displayName: "ปริญญา",
  pictureUrl: null, // we'll render initials
  initials: "ป",
};

window.CATEGORIES = [
  { id: "rec",      name: "แนะนำ",         nameEn: "Recommended" },
  { id: "rice",     name: "อาหารจานเดียว", nameEn: "Rice & Noodles" },
  { id: "main",     name: "อาหารจานหลัก",  nameEn: "Main Dishes" },
  { id: "drink",    name: "เครื่องดื่ม",   nameEn: "Drinks" },
  { id: "dessert",  name: "ของหวาน",       nameEn: "Desserts" },
];

// 18 items
window.MENU = [
  { id: "m1",  cat: "rec",     rec: true,  name: "ผัดไทยกุ้งสด",      nameEn: "Pad Thai Goong",        price: 95,  desc: "ผัดไทยเส้นจันท์กับกุ้งแม่น้ำสด ไข่ ถั่วงอก ใบกุยช่าย ตามตำรับโบราณ", imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=900&q=80&auto=format&fit=crop", rating: 4.8, reviews: 142 },
  { id: "m2",  cat: "rec",     rec: true,  name: "ต้มยำกุ้งน้ำข้น",   nameEn: "Tom Yum Goong",         price: 180, desc: "ต้มยำกุ้งแม่น้ำสด รสจัดจ้าน เผ็ดร้อนเปรี้ยวจี๊ด หอมตะไคร้ใบมะกรูด", imageUrl: "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=900&q=80&auto=format&fit=crop", rating: 4.9, reviews: 210 },
  { id: "m3",  cat: "rec",     rec: true,  name: "ส้มตำไทย",          nameEn: "Som Tum Thai",          price: 65,  desc: "ส้มตำไทยตำสด หอมปลาร้ากำลังดี ใส่ถั่วลิสงคั่วบด มีกุ้งแห้ง",       imageUrl: "https://images.unsplash.com/photo-1572455024681-fde7b4f1f4ee?w=900&q=80&auto=format&fit=crop", rating: 4.7, reviews: 98 },
  { id: "m4",  cat: "rice",                name: "ข้าวผัดปู",         nameEn: "Crab Fried Rice",       price: 120, desc: "ข้าวผัดเนื้อปูก้อน หอมไข่ น้ำมันงา ใส่ต้นหอมและพริกขี้หนู",            imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=900&q=80&auto=format&fit=crop", rating: 4.6, reviews: 76 },
  { id: "m5",  cat: "rice",                name: "ผัดกะเพราหมูสับ",  nameEn: "Pad Krapow Moo",         price: 75,  desc: "ผัดกะเพราหมูสับใบกะเพราเด็ดสด เสิร์ฟพร้อมไข่ดาวกรอบ",                imageUrl: "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=900&q=80&auto=format&fit=crop&sat=-50", rating: 4.8, reviews: 188 },
  { id: "m6",  cat: "rice",                name: "ข้าวมันไก่",        nameEn: "Khao Man Gai",          price: 70,  desc: "ข้าวมันไก่ต้มหุงด้วยน้ำมันไก่ เสิร์ฟกับน้ำจิ้มเต้าเจี้ยวสูตรเด็ด",         imageUrl: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=900&q=80&auto=format&fit=crop", rating: 4.5, reviews: 64 },
  { id: "m7",  cat: "rice",                name: "ก๋วยเตี๋ยวเรือ",    nameEn: "Boat Noodles",          price: 55,  desc: "ก๋วยเตี๋ยวเรือน้ำตกข้นๆ หมูสไลซ์ ลูกชิ้น ถั่วงอก",                       imageUrl: "https://images.unsplash.com/photo-1547928576-b822bc410bdf?w=900&q=80&auto=format&fit=crop", rating: 4.7, reviews: 102 },
  { id: "m8",  cat: "main",                name: "แกงเขียวหวานไก่",   nameEn: "Green Curry Chicken",   price: 110, desc: "แกงเขียวหวานไก่บ้าน มะเขือเปราะ มะเขือพวง ใบโหระพา",                 imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&q=80&auto=format&fit=crop", rating: 4.6, reviews: 88 },
  { id: "m9",  cat: "main",                name: "ปลาทอดสามรส",       nameEn: "Three-Flavor Fish",     price: 220, desc: "ปลานิลทอดราดน้ำสามรส เปรี้ยว หวาน เผ็ด หอมเครื่องเทศ",               imageUrl: "https://images.unsplash.com/photo-1559847844-d04abe9b4a39?w=900&q=80&auto=format&fit=crop", rating: 4.8, reviews: 54 },
  { id: "m10", cat: "main",                name: "ผัดผักรวมเต้าหู้",   nameEn: "Stir-fry Veg & Tofu",   price: 80,  desc: "ผัดผักรวมเต้าหู้น้ำมันหอย ผักสดกรอบ น้ำมันน้อย",                       imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80&auto=format&fit=crop", rating: 4.4, reviews: 42 },
  { id: "m11", cat: "main",                name: "ลาบหมูคั่ว",        nameEn: "Larb Moo",              price: 95,  desc: "ลาบหมูคั่วสไตล์อีสาน ข้าวคั่วป่นหอม รสจัดจ้าน",                          imageUrl: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=900&q=80&auto=format&fit=crop", rating: 4.7, reviews: 71 },
  { id: "m12", cat: "drink",   rec: true,  name: "ชาไทยเย็น",         nameEn: "Thai Iced Tea",         price: 45,  desc: "ชาไทยเข้มข้น หอมกลิ่นใบชา ใส่นมสดและน้ำตาลหวานกำลังดี",              imageUrl: "https://images.unsplash.com/photo-1558857563-c0c3aaad3a35?w=900&q=80&auto=format&fit=crop", rating: 4.9, reviews: 154 },
  { id: "m13", cat: "drink",                name: "น้ำมะนาว",          nameEn: "Fresh Lime",            price: 35,  desc: "น้ำมะนาวคั้นสด เปรี้ยวหวานสดชื่น เสิร์ฟพร้อมน้ำแข็งเย็นๆ",                imageUrl: "https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=900&q=80&auto=format&fit=crop", rating: 4.5, reviews: 38 },
  { id: "m14", cat: "drink",                name: "น้ำมะพร้าวอ่อน",   nameEn: "Coconut Water",         price: 60,  desc: "น้ำมะพร้าวอ่อนแท้ๆ จากสวน หอมหวานธรรมชาติ",                            imageUrl: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=900&q=80&auto=format&fit=crop", rating: 4.7, reviews: 52 },
  { id: "m15", cat: "drink",                name: "เอสเพรสโซ่เย็น",   nameEn: "Iced Espresso",         price: 55,  desc: "กาแฟคั่วเข้มจากเชียงใหม่ รสนุ่มลึก หอมกลิ่นช็อกโกแลต",                  imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=900&q=80&auto=format&fit=crop", rating: 4.6, reviews: 89 },
  { id: "m16", cat: "dessert", rec: true,  name: "ข้าวเหนียวมะม่วง",  nameEn: "Mango Sticky Rice",     price: 90,  desc: "ข้าวเหนียวมูนกะทิหอมหวาน เสิร์ฟพร้อมมะม่วงน้ำดอกไม้",                  imageUrl: "https://images.unsplash.com/photo-1711161629066-99e2a48dfeae?w=900&q=80&auto=format&fit=crop", rating: 4.9, reviews: 198 },
  { id: "m17", cat: "dessert",              name: "บัวลอยไข่หวาน",    nameEn: "Bua Loy",               price: 55,  desc: "บัวลอยน้ำกะทิอุ่นๆ เสิร์ฟพร้อมไข่หวานนุ่มๆ",                            imageUrl: "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=900&q=80&auto=format&fit=crop", rating: 4.6, reviews: 47 },
  { id: "m18", cat: "dessert",              name: "ทับทิมกรอบ",       nameEn: "Tub Tim Krob",          price: 50,  desc: "ทับทิมกรอบน้ำกะทิเย็นๆ หอมหวานชื่นใจ",                                    imageUrl: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=900&q=80&auto=format&fit=crop", rating: 4.5, reviews: 31 },
];

// Options definitions per item type (for item detail screen)
window.OPTIONS_BY_CAT = {
  rec:     ["spicy", "extras"],
  rice:    ["spicy", "extras"],
  main:    ["spicy"],
  drink:   ["sweet", "ice"],
  dessert: ["sweet"],
};

window.OPTION_GROUPS = {
  spicy: {
    title: "ระดับความเผ็ด",
    type: "radio",
    required: true,
    choices: [
      { id: "none",   name: "ไม่เผ็ด",       priceDelta: 0 },
      { id: "little", name: "เผ็ดน้อย",      priceDelta: 0 },
      { id: "med",    name: "เผ็ดปานกลาง",   priceDelta: 0, default: true },
      { id: "hot",    name: "เผ็ดมาก",       priceDelta: 0 },
    ],
  },
  sweet: {
    title: "ระดับความหวาน",
    type: "radio",
    required: true,
    choices: [
      { id: "0",   name: "ไม่หวาน",      priceDelta: 0 },
      { id: "50",  name: "หวานน้อย",     priceDelta: 0 },
      { id: "100", name: "หวานปกติ",     priceDelta: 0, default: true },
    ],
  },
  ice: {
    title: "ระดับน้ำแข็ง",
    type: "radio",
    required: true,
    choices: [
      { id: "less", name: "น้ำแข็งน้อย", priceDelta: 0 },
      { id: "norm", name: "ปกติ",         priceDelta: 0, default: true },
      { id: "no",   name: "ไม่ใส่น้ำแข็ง", priceDelta: 0 },
    ],
  },
  extras: {
    title: "เพิ่มพิเศษ",
    type: "checkbox",
    choices: [
      { id: "egg",      name: "ไข่ดาว",       priceDelta: 10 },
      { id: "rice_x",   name: "ข้าวพิเศษ",    priceDelta: 5 },
      { id: "shrimp_x", name: "เพิ่มกุ้ง 3 ตัว", priceDelta: 35 },
    ],
  },
};

// Order history (mock)
window.MOCK_HISTORY = [
  {
    id: "1232", time: "เมื่อวาน 19:42", today: false,
    total: 285, status: "served",
    items: [{name:"ผัดไทยกุ้งสด", qty:1}, {name:"ชาไทยเย็น", qty:2}, {name:"ข้าวเหนียวมะม่วง", qty:1}],
  },
  {
    id: "1198", time: "3 พ.ค. 18:10", today: false,
    total: 410, status: "served",
    items: [{name:"ต้มยำกุ้งน้ำข้น", qty:1}, {name:"ปลาทอดสามรส", qty:1}],
  },
  {
    id: "1051", time: "20 เม.ย. 12:30", today: false,
    total: 165, status: "served",
    items: [{name:"ข้าวผัดปู", qty:1}, {name:"น้ำมะนาว", qty:1}],
  },
];

window.STATUS_LABELS = {
  pending:  { label: "รอชำระ",     cls: "badge-warning" },
  paid:     { label: "ชำระแล้ว",   cls: "badge-info"    },
  cooking:  { label: "กำลังทำ",    cls: "badge-warning" },
  ready:    { label: "พร้อมเสิร์ฟ", cls: "badge-success" },
  served:   { label: "เสิร์ฟแล้ว",  cls: "badge-neutral" },
  failed:   { label: "ไม่สำเร็จ",   cls: "badge-error"   },
};
