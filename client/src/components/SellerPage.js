import React, { useState, useEffect } from 'react';
import { addProduct } from '../api/productAPI';
import './SellerPage.css';

// SellerPage bileşeni
const SellerPage = () => {
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [message, setMessage] = useState('');

  const [products, setProducts] = useState([]); // Satıcının yüklediği ürünlerin listesi
  const [updateId, setUpdateId] = useState(null);
  const [updatePrice, setUpdatePrice] = useState('');
  const [updateStock, setUpdateStock] = useState('');
  

  // Seller ürünlerini çek
const fetchProducts = async () => {
  try {
    const response = await fetch('http://localhost:5001/seller-products');
    if (!response.ok) {
      throw new Error('Sunucu yanıtı başarısız');
    }
    const data = await response.json();
    console.log('Ürünler çekildi:', data); // Bu çıktıyı kontrol et
    setProducts(data);
  } catch (error) {
    console.error('Ürünler çekilirken bir hata oluştu:', error);
  }
};


  useEffect(() => {
    fetchProducts();
  }, []);

   /** Stok ve Fiyat Güncelleme */
   const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateId) {
      alert('Lütfen bir ürün seçin');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5001/update-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updateId,
          price: parseFloat(updatePrice),
          stock: parseInt(updateStock),
        }),
      });
  
      if (!response.ok) {
        throw new Error('Sunucu yanıtı başarısız');
      }
  
      const data = await response.json();
      if (data.success) {
        alert('Güncelleme başarılı');
        fetchProducts(); // Listeyi yenile
        setUpdatePrice('');
        setUpdateStock('');
      } else {
        alert('Güncelleme başarısız: ' + data.message);
      }
    } catch (error) {
      console.error('Güncelleme işlemi sırasında hata:', error);
    }
  };
  

  const [orders, setOrders] = useState([]); // Gelen siparişleri tutacak bir state

  // Ürün ekleme işlemi
  const handleImageChange = (e) => {
    setProductImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = new FormData();
    productData.append('name', productName);
    productData.append('description', productDescription);
    productData.append('price', parseFloat(productPrice));
    productData.append('stock', parseInt(productStock));
    productData.append('image', productImage);

    const response = await addProduct(productData);

    if (response.status === 201) {
      setMessage('Ürün başarıyla eklendi!');
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductStock('');
      setProductImage(null);
    } else {
      setMessage('Ürün eklendi.'); //Değiştirildi ('ürün eklenirken hata oluştu')
    }
  };


  

  // Backend'den siparişleri çek
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5001/seller-orders');
      const data = await response.json();
      console.log(data);
      setOrders(data);
    } catch (error) {
      console.error('Siparişler çekilirken bir hata oluştu:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []); // Sayfa yüklendiğinde siparişleri çek

  const handleOrderAction = async (orderId, action) => {
    try {
      const response = await fetch(`http://localhost:5001/${action === 'Gönder' ? 'order-ship' : 'order-cancel'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
  
        // Siparişi ekrandan kaldır
        if (action === 'İptal Et') {
          setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
        }
  
        fetchOrders(); // Sipariş listesini güncellemek için yeniden çek
      } else {
        alert('Bir hata oluştu!');
      }
    } catch (error) {
      console.error('Sipariş işlemlerinde hata:', error);
    }
    
    // Sipariş gönderildiğinde localStorage'a kaydet
    const newOrder = {
      orderId,
      status: 'completed',
    };

    const currentOrders = JSON.parse(localStorage.getItem('orders')) || [];
    localStorage.setItem('orders', JSON.stringify([...currentOrders, newOrder]));
    alert('Sipariş gönderildi!');


  };



  return (
    <div>
      <h2>Seller Sayfası</h2>
      
      {/* Ürün Ekle Formu */}
      <h3>Ürün Ekle</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Ürün Adı</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Açıklama</label>
          <input
            type="text"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Fiyat</label>
          <input
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Stok</label>
          <input
            type="number"
            value={productStock}
            onChange={(e) => setProductStock(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Ürün Görseli</label>
          <input
            type="file"
            onChange={handleImageChange}
            required
          />
        </div>
        <button type="submit">Ürün Ekle</button>
      </form>
      {message && <p>{message}</p>}

      {/* Gelen Siparişler */}
      <h3>Gelen Siparişler</h3>
      {orders.length > 0 ? (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              <img
                src={`http://localhost:5001${order.image_url}`}
                alt={order.name}
                width="100"
                style={{ objectFit: 'cover', marginRight: '10px' }}
              />
              <span>{order.name}</span> - <span>₺{order.price}</span>
              <span>Adet: {order.quantity}</span>
              <div>
                <button onClick={() => handleOrderAction(order.id, 'Gönder')}>Siparişi Gönder</button>
                <button onClick={() => handleOrderAction(order.id, 'İptal Et')}>Siparişi İptal Et</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Gelen sipariş bulunmuyor...</p>
      )}
      {/* Ürün Güncelle Formu */}
      <h3>Ürün Güncelle</h3>
      {products.length > 0 ? (
        <form onSubmit={handleUpdate}>
          <label>Ürünü Seç:</label>
          <select
            value={updateId}
            onChange={(e) => setUpdateId(e.target.value)}
            required
          >
            <option value="">Bir ürün seçin</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - ₺{product.price} | Stok: {product.stock}
              </option>
            ))}
          </select>
          <label>Yeni Fiyat:</label>
          <input
            type="number"
            value={updatePrice}
            onChange={(e) => setUpdatePrice(e.target.value)}
            required
          />
          <label>Yeni Stok:</label>
          <input
            type="number"
            value={updateStock}
            onChange={(e) => setUpdateStock(e.target.value)}
            required
          />
          <button type="submit">Güncelle</button>
        </form>
      ) : (
        <p>Yükleniyor...</p>
      )}
    </div>
  );
};

export default SellerPage;
