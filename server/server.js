const express = require('express');
const app = express(); // ✅ app burada tanımlanmalı

const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./config/db'); // Veritabanı bağlantısı
require('dotenv').config(); // .env dosyasındaki verileri yükler

dotenv.config(); // .env dosyasındaki değişkenleri yükler


// Multer Konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null , path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());

// API Routes
// Test Database Route
app.get('/api/test-db', (req, res) => {
  db.query('SHOW TABLES;', (err, results) => {
    if (err) {
      console.error('Veritabanı bağlantı hatası:', err);
      return res.status(500).send('Veritabanı bağlantı hatası!');
    }
    res.status(200).send({ message: 'Veritabanına bağlanıldı', results });
  });
});
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

//kayıt
app.post('/register', (req, res) => {
    const { name, email, password, phone, user_type } = req.body;
  
    if (!name || !email || !password || !phone || !user_type) {
      return res.status(400).json({ success: false, message: 'Eksik alanlar var' });
    }
  
    const hashedPassword = bcrypt.hashSync(password, 10);
  
    const query = 'INSERT INTO users (name, email, password, phone, user_type) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, email, hashedPassword, phone, user_type], (err, result) => {
      if (err) {
        console.error('Kayıt hatası:', err);
        return res.status(500).json({ success: false, message: 'Bir hata oluştu' });
      }
      res.status(201).json({ success: true, message: 'Kayıt başarılı' });
    });
  });
  
 // Kullanıcı Giriş
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, result) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).json({ message: 'Bir hata oluştu.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const user = result[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Şifre kontrol hatası:', err);
        return res.status(500).json({ message: 'Bir hata oluştu.' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Geçersiz şifre!' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET çevresel değişkeni tanımlanmamış!');
        return res.status(500).json({ message: 'Sunucu yapılandırma hatası.' });
      }

      // Şifre doğru ise token oluştur
      const token = jwt.sign(
        { userId: user.id, email: user.email, user_type: user.user_type }, // user_type burada taşınıyor
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Kullanıcının verileriyle dönerken user_type'i döndür
      res.status(200).json({
        message: 'Başarıyla giriş yapıldı',
        token,
        user: {
          email: user.email,
          phone: user.phone,
          name: user.name || 'Kullanıcı',
          user_type: user.user_type // Kullanıcının türü döndürülüyor
        },
      });
    });
  });
});


// Sepet için sipariş oluşturma
app.post('/checkout', (req, res) => {
  const { customerPhone, items } = req.body;

  // Kullanıcının ID'sini telefon numarasından alın
  const getCustomerQuery = `SELECT * FROM users WHERE phone = ?`;
  db.query(getCustomerQuery, [customerPhone], (err, results) => {
    if (err || results.length === 0) {
      console.error('Kullanıcı bulunamadı:', customerPhone);
      return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı! Telefon: ${customerPhone}', });
    }

    const customerId = results[0].id;

    // Sepet verilerini veritabanına ekle
    const insertCartQuery = `
      INSERT INTO cart (customer_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `;
    // İşlemler sırasında ürünün id'sini çek
    const processItems = async () => {
      for (let item of items) {
        try {
          // `products` tablosundan ürünün ID'sini çek
          const productQuery = `SELECT id FROM products WHERE image_url = ?`;
          const productResult = await new Promise((resolve, reject) => {
            db.query(productQuery, [item.image_url], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });

          if (productResult.length > 0) {
            const productId = productResult[0].id;

            // Bu ürünün ID'sini `cart`e ekleyin
            await new Promise((resolve, reject) => {
              db.query(insertCartQuery, [customerId, productId, item.quantity], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          } else {
            console.error('Ürün bulunamadı:', item.image_url);
          }
        } catch (error) {
          console.error('Sepet işlemi sırasında hata:', error);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Sipariş başarıyla tamamlandı!',
      });
    };

    processItems();
  });
});   

//ürün çekme
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Ürünler çekilirken hata:', err);
      return res.status(500).json({ message: 'Ürünler çekilirken bir hata oluştu.' });
    }

    res.status(200).json(results);
  });
});
app.get('/api/products', async (req, res) => {
  try {
    db.query('SELECT * FROM products', (error, results) => {
      if (error) {
        console.error('Sunucu tarafı hata:', error);
        return res.status(500).json({ message: 'Ürünler çekilirken hata oluştu.' });
      }
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
    res.status(500).json({ message: 'Beklenmeyen hata' });
  }
});


//ürün ekleme
app.post('/add-product', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Resim yüklenmedi veya dosya hatalı!' });
  }

  const { name, description, price, stock } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const query = 'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)';

  db.query(query, [name, description, price, stock, imagePath], (err, result) => {
    if (err) {
      console.error('Ürün eklenirken hata:', err);
      return res.status(500).json({ message: 'Ürün eklenirken hata oluştu.' }); 
    }
    else{
      console.log(imagePath);

    res.status(201).json({ message: 'Ürün başarıyla eklendi.', image_url: imagePath });
    }
  });
});


// Gelen siparişleri çekme
app.get('/seller-orders', (req, res) => {
  const query = `
    SELECT cart.id, cart.customer_id, cart.product_id, cart.quantity, products.name, products.image_url
    FROM cart
    JOIN products ON cart.product_id = products.id
    WHERE shipped = 0;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Siparişler çekilirken hata:', err);
      return res.status(500).json({ message: 'Siparişler çekilirken bir hata oluştu.' });
    }

    console.log(results); 
    res.status(200).json(results);
  });
});


// Seller'ın ürünlerini çekmek için
// Seller'ın ürünlerini çekmek için
const mysql = require('mysql2/promise'); // Promise uyumlu MySQL istemcisi

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Amine12345.', // MySQL şifre bilgileri
  database: 'eticaret1',
};

let connection;

const initializeDb = async () => {
  try {
    connection = await mysql.createPool(dbConfig); // MySQL bağlantısını başlat
    console.log('Veritabanına bağlanıldı.');
  } catch (error) {
    console.error('Veritabanına bağlanırken hata:', error);
  }
};

const getConnection = () => connection; // Veritabanı bağlantısını döndüren bir metod

module.exports = {
  initializeDb,
  getConnection,
};

/* app.get('/seller-products', async (req, res) => {
  try {
    db.query('SELECT * FROM products', (error, results) => {
      if (error) {
        console.error('Sunucu tarafı hata:', error);
        return res.status(500).json({ message: 'Ürünler çekilirken hata oluştu.' });
      }
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Beklenmeyen hata:', error);
    res.status(500).json({ message: 'Beklenmeyen hata' });
  }
}); */




// Ürün güncelle işlemleri
app.post('/update-product', async (req, res) => {
  const { id, price, stock } = req.body; // Gönderilen verileri al

  if (!id || price === undefined || stock === undefined) {
    return res.status(400).json({ success: false, message: 'Eksik veri gönderildi' });
  }

  try {
    db.query(
      'UPDATE products SET price = ?, stock = ? WHERE id = ?',
      [price, stock, id],
      (error, results) => {
        if (error) {
          console.error('Veritabanı hatası:', error);
          return res.status(500).json({ success: false, message: 'Sunucu hatası' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }

        res.status(200).json({ success: true, message: 'Güncelleme başarılı' });
      }
    );
  } catch (error) {
    console.error('Beklenmeyen sunucu hatası:', error);
    res.status(500).json({ success: false, message: 'Beklenmeyen hata' });
  }
});

// SİPARİŞ İPTAL
app.post('/order-cancel', (req, res) => {
  const { orderId } = req.body;

  const query = 'DELETE FROM cart WHERE id = ?';
  db.query(query, [orderId], (err, result) => {
    if (err) {
      console.error('Sipariş silinirken hata:', err);
      return res.status(500).json({ success: false, message: 'Sipariş silinirken bir hata oluştu.' });
    }

    res.status(200).json({ success: true, message: 'Sipariş başarıyla iptal edildi.' });
  });

});


