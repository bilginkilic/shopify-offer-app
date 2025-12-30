import { useState } from "react";
import styles from "./OfferForm.module.css";

export default function OfferForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    offerPrice: "",
    quantity: 1,
    message: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "İsim gereklidir";
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email gereklidir";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Geçerli bir email giriniz";
    }

    if (!formData.offerPrice) {
      newErrors.offerPrice = "Teklif fiyatı gereklidir";
    } else if (parseFloat(formData.offerPrice) <= 0) {
      newErrors.offerPrice = "Teklif fiyatı 0'dan büyük olmalıdır";
    } else if (parseFloat(formData.offerPrice) >= product.price) {
      newErrors.offerPrice = "Teklif fiyatı orijinal fiyattan düşük olmalıdır";
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Geçerli bir adet giriniz";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const offerData = {
        ...formData,
        productId: product.id,
        productTitle: product.title,
        productImage: product.image,
        originalPrice: product.price,
        offerPrice: parseFloat(formData.offerPrice),
        quantity: parseInt(formData.quantity)
      };

      await onSubmit(offerData);
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({ submit: "Teklif gönderilirken hata oluştu" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const discount = formData.offerPrice
    ? Math.round(((product.price - parseFloat(formData.offerPrice)) / product.price) * 100)
    : 0;

  return (
    <div className={styles.formContainer}>
      <div className={styles.productInfo}>
        {product.image && (
          <img src={product.image} alt={product.title} className={styles.productImage} />
        )}
        <div className={styles.productDetails}>
          <h3 className={styles.productTitle}>{product.title}</h3>
          <p className={styles.productPrice}>
            Orijinal Fiyat: <strong>{product.price.toFixed(2)} TL</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="customerName" className={styles.label}>
            Adınız Soyadınız *
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            className={`${styles.input} ${errors.customerName ? styles.inputError : ""}`}
            placeholder="Adınız Soyadınız"
          />
          {errors.customerName && (
            <span className={styles.errorText}>{errors.customerName}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="customerEmail" className={styles.label}>
            Email Adresiniz *
          </label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            className={`${styles.input} ${errors.customerEmail ? styles.inputError : ""}`}
            placeholder="email@ornek.com"
          />
          {errors.customerEmail && (
            <span className={styles.errorText}>{errors.customerEmail}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="customerPhone" className={styles.label}>
            Telefon Numaranız
          </label>
          <input
            type="tel"
            id="customerPhone"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            className={styles.input}
            placeholder="0555 123 45 67"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="offerPrice" className={styles.label}>
              Teklif Fiyatınız (TL) *
            </label>
            <input
              type="number"
              id="offerPrice"
              name="offerPrice"
              value={formData.offerPrice}
              onChange={handleChange}
              className={`${styles.input} ${errors.offerPrice ? styles.inputError : ""}`}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            {errors.offerPrice && (
              <span className={styles.errorText}>{errors.offerPrice}</span>
            )}
            {formData.offerPrice && discount > 0 && (
              <span className={styles.discount}>%{discount} indirim</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="quantity" className={styles.label}>
              Adet *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={`${styles.input} ${errors.quantity ? styles.inputError : ""}`}
              min="1"
            />
            {errors.quantity && (
              <span className={styles.errorText}>{errors.quantity}</span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="message" className={styles.label}>
            Mesajınız (İsteğe Bağlı)
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="Teklifinizle ilgili ek bilgi..."
            rows="4"
          />
        </div>

        {errors.submit && (
          <div className={styles.submitError}>{errors.submit}</div>
        )}

        <div className={styles.formActions}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              İptal
            </button>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Gönderiliyor..." : "Teklif Gönder"}
          </button>
        </div>
      </form>
    </div>
  );
}
