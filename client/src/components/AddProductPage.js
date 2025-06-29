import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addProduct } from '../api/productAPI';






const AddProductPage = ({ onProductAdded }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);


  // Input değişikliklerini işleyen fonksiyon
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  // Dosya seçildiğinde bu işlemi gerçekleştirin
const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
        setSelectedFile(e.target.files[0]);
      }
  };


  // Form gönderimini işleyen fonksiyon
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
        setError('Lütfen bir resim dosyası seçin.');
        return;
      }

    const loggedInUser = JSON.parse(localStorage.getItem('user'));

    if (!loggedInUser || loggedInUser.user_type !== 'seller') {
      setMessage('Sadece satıcılar ürün ekleyebilir.');
      return;
    }

    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('price', product.price);
    formData.append('stock', product.stock);
    formData.append('image', selectedFile); // Doğru isimlendirme

    try {
      const response = await addProduct(formData);
      console.log(response);
      const responseBody = await response.json(); // Yanıt içeriğini burada alıyoruz
      console.log('Yanıt:', responseBody); // Tarayıcı konsoluna yazdır
      console.log('Response status:', response.status);

      if (response.status === 201) {
        setMessage('Ürün başarıyla eklendi!');
        if (onProductAdded) onProductAdded();
        navigate('/products'); // Ürün ekleme sonrası yönlendirme
      } else {
        throw new Error(response?.message || 'Ürün eklenirken hata oluştu.'); 
      }
    } catch (err) {
      console.error('Ürün eklenirken hata:', err);
      setError(err.message || 'Beklenmedik bir hata oluştu.');
    }
  };

  return (
    <div>
      <h1>Ürün Ekle</h1>
      <form onSubmit={handleSubmit}>
        {/* Ürün Adı */}
        <input
          type="text"
          name="name"
          placeholder="Ürün Adı"
          value={product.name}
          onChange={handleChange}
          required
        />
        
        {/* Açıklama */}
        <textarea
          name="description"
          placeholder="Ürün Açıklaması"
          value={product.description}
          onChange={handleChange}
          required
        />
        
        {/* Fiyat */}
        <input
          type="number"
          name="price"
          placeholder="Fiyat"
          value={product.price}
          onChange={handleChange}
          required
        />

        {/* Stok */}
        <input
          type="number"
          name="stock"
          placeholder="Stok Adedi"
          value={product.stock}
          onChange={handleChange}
          required
        />

        {/* Dosya Seçimi */}
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleFileChange}
          required
        />

        {/* Gönder Butonu */}
        <button type="submit">Ürünü Ekle</button>
      </form>

      {/* Başarı ve Hata Mesajları */}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddProductPage;
