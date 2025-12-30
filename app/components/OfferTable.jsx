import { useState } from "react";
import styles from "./OfferTable.module.css";

const STATUS_LABELS = {
  pending: "Beklemede",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  countered: "Karşı Teklif"
};

const STATUS_COLORS = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
  countered: "info"
};

export default function OfferTable({ offers, onView, onUpdate, onDelete, isLoading }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(offers.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "short",
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

  const calculateDiscount = (original, offer) => {
    return Math.round(((original - offer) / original) * 100);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Teklifler yükleniyor...</p>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Henüz teklif bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === offers.length}
                  onChange={handleSelectAll}
                  className={styles.checkbox}
                />
              </th>
              <th>Müşteri</th>
              <th>Ürün</th>
              <th>Orijinal Fiyat</th>
              <th>Teklif Fiyat</th>
              <th>İndirim</th>
              <th>Adet</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className={selectedIds.includes(offer.id) ? styles.selected : ""}>
                <td className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(offer.id)}
                    onChange={() => handleSelectOne(offer.id)}
                    className={styles.checkbox}
                  />
                </td>
                <td>
                  <div className={styles.customerInfo}>
                    <div className={styles.customerName}>{offer.customerName}</div>
                    <div className={styles.customerEmail}>{offer.customerEmail}</div>
                  </div>
                </td>
                <td>
                  <div className={styles.productInfo}>
                    {offer.productImage && (
                      <img
                        src={offer.productImage}
                        alt={offer.productTitle}
                        className={styles.productImage}
                      />
                    )}
                    <div>
                      <div className={styles.productTitle}>{offer.productTitle}</div>
                      {offer.variantTitle && (
                        <div className={styles.variantTitle}>{offer.variantTitle}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={styles.priceCell}>
                  {formatCurrency(offer.originalPrice)}
                </td>
                <td className={styles.priceCell}>
                  <strong>{formatCurrency(offer.offerPrice)}</strong>
                  {offer.counterPrice && (
                    <div className={styles.counterPrice}>
                      Karşı: {formatCurrency(offer.counterPrice)}
                    </div>
                  )}
                </td>
                <td className={styles.discountCell}>
                  <span className={styles.discountBadge}>
                    -%{calculateDiscount(offer.originalPrice, offer.offerPrice)}
                  </span>
                </td>
                <td className={styles.quantityCell}>
                  {offer.quantity}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[STATUS_COLORS[offer.status]]}`}>
                    {STATUS_LABELS[offer.status]}
                  </span>
                </td>
                <td className={styles.dateCell}>
                  {formatDate(offer.createdAt)}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onView(offer)}
                      className={styles.viewButton}
                      title="Görüntüle"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3C4.5 3 1.73 5.61 1 9c.73 3.39 3.5 6 7 6s6.27-2.61 7-6c-.73-3.39-3.5-6-7-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>
                    {offer.status === "pending" && (
                      <>
                        <button
                          onClick={() => onUpdate(offer.id, { status: "accepted" })}
                          className={styles.acceptButton}
                          title="Kabul Et"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M6 11L2 7l1.41-1.41L6 8.17l6.59-6.59L14 3l-8 8z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => onUpdate(offer.id, { status: "rejected" })}
                          className={styles.rejectButton}
                          title="Reddet"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12 4.7L11.3 4 8 7.3 4.7 4 4 4.7 7.3 8 4 11.3l.7.7L8 8.7l3.3 3.3.7-.7L8.7 8z"/>
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDelete(offer.id)}
                      className={styles.deleteButton}
                      title="Sil"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6 2h4v1H6V2zm7 1h-2V2c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1v1H3c-.55 0-1 .45-1 1v1h12V4c0-.55-.45-1-1-1zM3 6v8c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V6H3z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
