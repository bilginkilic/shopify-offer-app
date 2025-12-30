import styles from "./OfferStats.module.css";

export default function OfferStats({ stats }) {
  const cards = [
    {
      title: "Toplam Teklif",
      value: stats?.total || 0,
      icon: "📊",
      color: "blue"
    },
    {
      title: "Bekleyen",
      value: stats?.pending || 0,
      icon: "⏳",
      color: "yellow"
    },
    {
      title: "Kabul Edilen",
      value: stats?.accepted || 0,
      icon: "✅",
      color: "green"
    },
    {
      title: "Reddedilen",
      value: stats?.rejected || 0,
      icon: "❌",
      color: "red"
    },
    {
      title: "Karşı Teklif",
      value: stats?.countered || 0,
      icon: "🔄",
      color: "purple"
    },
    {
      title: "Toplam Tasarruf",
      value: `${stats?.totalSavings?.toFixed(2) || 0} TL`,
      icon: "💰",
      color: "orange"
    }
  ];

  return (
    <div className={styles.statsContainer}>
      {cards.map((card, index) => (
        <div key={index} className={`${styles.statCard} ${styles[card.color]}`}>
          <div className={styles.cardIcon}>{card.icon}</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{card.title}</div>
            <div className={styles.cardValue}>{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
