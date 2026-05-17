-- ============================================================
-- Per's Restaurant — Seed Data
-- ============================================================

-- Categories
INSERT INTO categories (id, name, name_en, sort_order) VALUES
  ('rec',     'แนะนำ',         'Recommended',  0),
  ('rice',    'อาหารจานเดียว', 'Rice & Noodles', 1),
  ('main',    'อาหารจานหลัก',  'Main Dishes',  2),
  ('drink',   'เครื่องดื่ม',   'Drinks',       3),
  ('dessert', 'ของหวาน',       'Desserts',     4)
ON CONFLICT (id) DO NOTHING;

-- Option Groups
INSERT INTO option_groups (id, title, type, is_required) VALUES
  ('spicy',  'ระดับความเผ็ด', 'radio',    TRUE),
  ('sweet',  'ระดับความหวาน', 'radio',    TRUE),
  ('ice',    'ระดับน้ำแข็ง',  'radio',    TRUE),
  ('extras', 'เพิ่มพิเศษ',    'checkbox', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Category → Option Group mappings
INSERT INTO category_option_groups (category_id, option_group_id) VALUES
  ('rec',     'spicy'),
  ('rec',     'extras'),
  ('rice',    'spicy'),
  ('rice',    'extras'),
  ('main',    'spicy'),
  ('drink',   'sweet'),
  ('drink',   'ice'),
  ('dessert', 'sweet')
ON CONFLICT DO NOTHING;

-- Option Choices: spicy
INSERT INTO option_choices (option_group_id, name, price_delta, is_default, sort_order) VALUES
  ('spicy', 'ไม่เผ็ด',     0, FALSE, 0),
  ('spicy', 'เผ็ดน้อย',    0, FALSE, 1),
  ('spicy', 'เผ็ดปานกลาง', 0, TRUE,  2),
  ('spicy', 'เผ็ดมาก',     0, FALSE, 3)
ON CONFLICT DO NOTHING;

-- Option Choices: sweet
INSERT INTO option_choices (option_group_id, name, price_delta, is_default, sort_order) VALUES
  ('sweet', 'ไม่หวาน',  0, FALSE, 0),
  ('sweet', 'หวานน้อย', 0, FALSE, 1),
  ('sweet', 'หวานปกติ', 0, TRUE,  2)
ON CONFLICT DO NOTHING;

-- Option Choices: ice
INSERT INTO option_choices (option_group_id, name, price_delta, is_default, sort_order) VALUES
  ('ice', 'น้ำแข็งน้อย',   0, FALSE, 0),
  ('ice', 'ปกติ',           0, TRUE,  1),
  ('ice', 'ไม่ใส่น้ำแข็ง', 0, FALSE, 2)
ON CONFLICT DO NOTHING;

-- Option Choices: extras
INSERT INTO option_choices (option_group_id, name, price_delta, is_default, sort_order) VALUES
  ('extras', 'ไข่ดาว',          10, FALSE, 0),
  ('extras', 'ข้าวพิเศษ',       5,  FALSE, 1),
  ('extras', 'เพิ่มกุ้ง 3 ตัว', 35, FALSE, 2)
ON CONFLICT DO NOTHING;

-- Restaurant Tables (12 tables)
INSERT INTO restaurant_tables (id, label, status) VALUES
  (1,  'โต๊ะ 1',  'empty'),
  (2,  'โต๊ะ 2',  'empty'),
  (3,  'โต๊ะ 3',  'empty'),
  (4,  'โต๊ะ 4',  'empty'),
  (5,  'โต๊ะ 5',  'empty'),
  (6,  'โต๊ะ 6',  'empty'),
  (7,  'โต๊ะ 7',  'empty'),
  (8,  'โต๊ะ 8',  'empty'),
  (9,  'โต๊ะ 9',  'empty'),
  (10, 'โต๊ะ 10', 'empty'),
  (11, 'โต๊ะ 11', 'empty'),
  (12, 'โต๊ะ 12', 'empty')
ON CONFLICT (id) DO NOTHING;

-- Menu Items (18 items matching the design)
INSERT INTO menu_items (category_id, name, name_en, description, price, image_url, is_recommended, rating, review_count, sort_order)
VALUES
  -- Recommended
  ('rec', 'ผัดไทยกุ้งสด',    'Pad Thai Goong',
   'ผัดไทยเส้นจันท์กับกุ้งแม่น้ำสด ไข่ ถั่วงอก ใบกุยช่าย ตามตำรับโบราณ',
   95, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=900&q=80&auto=format&fit=crop',
   TRUE, 4.8, 142, 0),

  ('rec', 'ต้มยำกุ้งน้ำข้น', 'Tom Yum Goong',
   'ต้มยำกุ้งแม่น้ำสด รสจัดจ้าน เผ็ดร้อนเปรี้ยวจี๊ด หอมตะไคร้ใบมะกรูด',
   180, 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=900&q=80&auto=format&fit=crop',
   TRUE, 4.9, 210, 1),

  ('rec', 'ส้มตำไทย',         'Som Tum Thai',
   'ส้มตำไทยตำสด หอมปลาร้ากำลังดี ใส่ถั่วลิสงคั่วบด มีกุ้งแห้ง',
   65, 'https://images.unsplash.com/photo-1572455024681-fde7b4f1f4ee?w=900&q=80&auto=format&fit=crop',
   TRUE, 4.7, 98, 2),

  -- Rice & Noodles
  ('rice', 'ข้าวผัดปู',        'Crab Fried Rice',
   'ข้าวผัดเนื้อปูก้อน หอมไข่ น้ำมันงา ใส่ต้นหอมและพริกขี้หนู',
   120, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.6, 76, 0),

  ('rice', 'ผัดกะเพราหมูสับ', 'Pad Krapow Moo',
   'ผัดกะเพราหมูสับใบกะเพราเด็ดสด เสิร์ฟพร้อมไข่ดาวกรอบ',
   75, 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=900&q=80&auto=format&fit=crop&sat=-50',
   FALSE, 4.8, 188, 1),

  ('rice', 'ข้าวมันไก่',       'Khao Man Gai',
   'ข้าวมันไก่ต้มหุงด้วยน้ำมันไก่ เสิร์ฟกับน้ำจิ้มเต้าเจี้ยวสูตรเด็ด',
   70, 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.5, 64, 2),

  ('rice', 'ก๋วยเตี๋ยวเรือ',  'Boat Noodles',
   'ก๋วยเตี๋ยวเรือน้ำตกข้นๆ หมูสไลซ์ ลูกชิ้น ถั่วงอก',
   55, 'https://images.unsplash.com/photo-1547928576-b822bc410bdf?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.7, 102, 3),

  -- Main Dishes
  ('main', 'แกงเขียวหวานไก่',  'Green Curry Chicken',
   'แกงเขียวหวานไก่บ้าน มะเขือเปราะ มะเขือพวง ใบโหระพา',
   110, 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.6, 88, 0),

  ('main', 'ปลาทอดสามรส',      'Three-Flavor Fish',
   'ปลานิลทอดราดน้ำสามรส เปรี้ยว หวาน เผ็ด หอมเครื่องเทศ',
   220, 'https://images.unsplash.com/photo-1559847844-d04abe9b4a39?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.8, 54, 1),

  ('main', 'ผัดผักรวมเต้าหู้',  'Stir-fry Veg & Tofu',
   'ผัดผักรวมเต้าหู้น้ำมันหอย ผักสดกรอบ น้ำมันน้อย',
   80, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.4, 42, 2),

  ('main', 'ลาบหมูคั่ว',       'Larb Moo',
   'ลาบหมูคั่วสไตล์อีสาน ข้าวคั่วป่นหอม รสจัดจ้าน',
   95, 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.7, 71, 3),

  -- Drinks
  ('drink', 'ชาไทยเย็น',       'Thai Iced Tea',
   'ชาไทยเข้มข้น หอมกลิ่นใบชา ใส่นมสดและน้ำตาลหวานกำลังดี',
   45, 'https://images.unsplash.com/photo-1558857563-c0c3aaad3a35?w=900&q=80&auto=format&fit=crop',
   TRUE, 4.9, 154, 0),

  ('drink', 'น้ำมะนาว',         'Fresh Lime',
   'น้ำมะนาวคั้นสด เปรี้ยวหวานสดชื่น เสิร์ฟพร้อมน้ำแข็งเย็นๆ',
   35, 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.5, 38, 1),

  ('drink', 'น้ำมะพร้าวอ่อน',  'Coconut Water',
   'น้ำมะพร้าวอ่อนแท้ๆ จากสวน หอมหวานธรรมชาติ',
   60, 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.7, 52, 2),

  ('drink', 'เอสเพรสโซ่เย็น',  'Iced Espresso',
   'กาแฟคั่วเข้มจากเชียงใหม่ รสนุ่มลึก หอมกลิ่นช็อกโกแลต',
   55, 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.6, 89, 3),

  -- Desserts
  ('dessert', 'ข้าวเหนียวมะม่วง', 'Mango Sticky Rice',
   'ข้าวเหนียวมูนกะทิหอมหวาน เสิร์ฟพร้อมมะม่วงน้ำดอกไม้',
   90, 'https://images.unsplash.com/photo-1711161629066-99e2a48dfeae?w=900&q=80&auto=format&fit=crop',
   TRUE, 4.9, 198, 0),

  ('dessert', 'บัวลอยไข่หวาน',   'Bua Loy',
   'บัวลอยน้ำกะทิอุ่นๆ เสิร์ฟพร้อมไข่หวานนุ่มๆ',
   55, 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.6, 47, 1),

  ('dessert', 'ทับทิมกรอบ',      'Tub Tim Krob',
   'ทับทิมกรอบน้ำกะทิเย็นๆ หอมหวานชื่นใจ',
   50, 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=900&q=80&auto=format&fit=crop',
   FALSE, 4.5, 31, 2);

-- Default staff accounts
-- owner: admin / password123
-- kitchen: kitchen / kitchen123
INSERT INTO staff (username, password_hash, display_name, role) VALUES
  ('admin',   crypt('password123', gen_salt('bf', 10)), 'เปอร์ (เจ้าของร้าน)', 'owner'),
  ('kitchen', crypt('kitchen123',  gen_salt('bf', 10)), 'ทีมครัว',              'kitchen'),
  ('waiter',  crypt('waiter123',   gen_salt('bf', 10)), 'พนักงานเสิร์ฟ',        'waiter')
ON CONFLICT (username) DO NOTHING;
