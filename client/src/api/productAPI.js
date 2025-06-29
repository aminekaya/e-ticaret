
export const addProduct = async (formData) => {
  try {
   
    const response = await fetch('http://localhost:5001/add-product', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ürün ekleme başarısız: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ürün eklenirken bir hata oluştu:', error);
    throw error;
  }
};
