import { useState, useEffect } from "react";
import styles from "./OfferModal.module.css";

const STATUS_LABELS = {
  pending: "Beklemede",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  countered: "Karşı Teklif"
};

const ACTION_LABELS = {
  created: "Oluşturuldu",
  status_changed: "Durum Değişti",
  price_updated: "Fiyat Güncellendi",
  note_added: "Not Eklendi"
};

export default function OfferModal({ offer, onClose, onUpdate }) {
  const [status, setStatus] = useState(offer?.status || "pending");
  const [counterPrice, setCounterPrice] = useState(offer?.counterPrice || "");
  const [adminNotes, setAdminNotes] = useState(offer?.adminNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (offer) {
      setStatus(offer.status);
      setCounterPrice(offer.counterPrice || "");
      setAdminNotes(offer.adminNotes || "");
    }
  }, [offer]);

  if (!offer) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount);
  };

  const calculateDiscount = (original, offerPrice) => {
    return Math.round(((original - offerPrice) / original) * 100);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(offer.id, {
        status,
        counterPrice: counterPrice ? parseFloat(counterPrice) : null,
        adminNotes
      });
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      alert("Güncelleme sırasında hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    return (
      status !== offer.status ||
      (counterPrice && parseFloat(counterPrice) !== offer.counterPrice) ||
      adminNotes !== (offer.adminNotes || "")
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Teklif Detayları</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Ürün Bilgileri */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ürün Bilgileri</h3>
            <div className={styles.productDetails}>
              {offer.productImage && (
                <img
                  src={offer.productImage}
                  alt={offer.productTitle}
                  className={styles.productImage}
                />
              )}
              <div>
                <h4>{offer.productTitle}</h4>
                {offer.variantTitle && (
                  <p className={styles.variant}>{offer.variantTitle}</p>
                )}
              </div>
            </div>
          </section>

          {/* Müşteri Bilgileri */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Müşteri Bilgileri</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>İsim:</span>
                <span className={styles.infoValue}>{offer.customerName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{offer.customerEmail}</span>
              </div>
              {offer.customerPhone && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Telefon:</span>
                  <span className={styles.infoValue}>{offer.customerPhone}</span>
                </div>
              )}
            </div>
          </section>

          {/* Fiyat Bilgileri */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Fiyat Bilgileri</h3>
            <div className={styles.priceGrid}>
              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>Orijinal Fiyat:</span>
                <span className={styles.priceValue}>{formatCurrency(offer.originalPrice)}</span>
              </div>
              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>Teklif Fiyatı:</span>
                <span className={`${styles.priceValue} ${styles.offerPrice}`}>
                  {formatCurrency(offer.offerPrice)}
                </span>
              </div>
              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>İndirim Oranı:</span>
                <span className={styles.discount}>
                  %{calculateDiscount(offer.originalPrice, offer.offerPrice)}
                </span>
              </div>
              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>Adet:</span>
                <span className={styles.priceValue}>{offer.quantity}</span>
              </div>
              <div className={styles.priceItem}>
                <span className={styles.priceLabel}>Toplam Tasarruf:</span>
                <span className={styles.savings}>
                  {formatCurrency((offer.originalPrice - offer.offerPrice) * offer.quantity)}
                </span>
              </div>
            </div>
          </section>

          {/* Müşteri Mesajı */}
          {offer.message && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Müşteri Mesajı</h3>
              <div className={styles.message}>{offer.message}</div>
            </section>
          )}

          {/* Yönetim Paneli */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Yönetim</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Durum</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={styles.select}
              >
                <option value="pending">Beklemede</option>
                <option value="accepted">Kabul Et</option>
                <option value="rejected">Reddet</option>
                <option value="countered">Karşı Teklif Yap</option>
              </select>
            </div>

            {status === "countered" && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Karşı Teklif Fiyatı (TL)</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className={styles.input}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Admin Notları</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className={styles.textarea}
                placeholder="İç notlar..."
                rows="4"
              />
            </div>
          </section>

          {/* Geçmiş */}
          {offer.logs && offer.logs.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>İşlem Geçmişi</h3>
              <div className={styles.timeline}>
                {offer.logs.map((log) => (
                  <div key={log.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot}></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineAction}>
                        {ACTION_LABELS[log.action] || log.action}
                      </div>
                      {log.oldValue && log.newValue && (
                        <div className={styles.timelineChange}>
                          {log.oldValue} → {log.newValue}
                        </div>
                      )}
                      {!log.oldValue && log.newValue && (
                        <div className={styles.timelineChange}>{log.newValue}</div>
                      )}
                      <div className={styles.timelineMeta}>
                        <span>{log.performedBy || "Sistem"}</span>
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tarihler */}
          <section className={styles.section}>
            <div className={styles.dates}>
              <div>
                <strong>Oluşturulma:</strong> {formatDate(offer.createdAt)}
              </div>
              <div>
                <strong>Son Güncelleme:</strong> {formatDate(offer.updatedAt)}
              </div>
            </div>
          </section>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            İptal
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={!hasChanges() || isSaving}
          >
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
