import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import prisma from "../db.server";
import OfferStats from "../components/OfferStats";
import OfferTable from "../components/OfferTable";
import OfferModal from "../components/OfferModal";
import styles from "../styles/offers.module.css";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "all";
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { productTitle: { contains: search } }
      ];
    }

    // Fetch offers and stats
    const [offers, total, stats] = await Promise.all([
      prisma.offer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          logs: {
            orderBy: { createdAt: "desc" },
            take: 3
          }
        }
      }),
      prisma.offer.count({ where }),
      prisma.offer.groupBy({
        by: ["status"],
        _count: true
      })
    ]);

    // Calculate statistics
    const allOffers = await prisma.offer.findMany();
    const statistics = {
      total: allOffers.length,
      pending: stats.find(s => s.status === "pending")?._count || 0,
      accepted: stats.find(s => s.status === "accepted")?._count || 0,
      rejected: stats.find(s => s.status === "rejected")?._count || 0,
      countered: stats.find(s => s.status === "countered")?._count || 0,
      totalSavings: allOffers.reduce((sum, offer) => {
        return sum + (offer.originalPrice - offer.offerPrice) * offer.quantity;
      }, 0)
    };

    return json({
      offers,
      statistics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: { status, search }
    });
  } catch (error) {
    console.error("Loader error:", error);
    return json({
      offers: [],
      statistics: {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        countered: 0,
        totalSavings: 0
      },
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      filters: { status: "all", search: "" },
      error: "Veriler yüklenirken hata oluştu"
    });
  }
}

export default function OffersPage() {
  const data = useLoaderData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(data.filters.search);
  const [statusFilter, setStatusFilter] = useState(data.filters.status);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    const params = new URLSearchParams(searchParams);
    params.set("status", status);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const handleViewOffer = (offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleUpdateOffer = async (id, updates) => {
    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      // Refresh the page data
      setIsRefreshing(true);
      navigate(".", { replace: true });
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (error) {
      console.error("Update error:", error);
      alert("Güncelleme başarısız oldu");
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!confirm("Bu teklifi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      // Refresh the page data
      setIsRefreshing(true);
      navigate(".", { replace: true });
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Silme işlemi başarısız oldu");
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    navigate(".", { replace: true });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fiyat Teklifleri</h1>
          <p className={styles.subtitle}>
            Müşteri tekliflerini görüntüleyin ve yönetin
          </p>
        </div>
        <button onClick={handleRefresh} className={styles.refreshButton} disabled={isRefreshing}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          {isRefreshing ? "Yenileniyor..." : "Yenile"}
        </button>
      </div>

      {data.error && (
        <div className={styles.errorBanner}>
          {data.error}
        </div>
      )}

      <OfferStats stats={data.statistics} />

      <div className={styles.filters}>
        <div className={styles.statusFilters}>
          {[
            { value: "all", label: "Tümü" },
            { value: "pending", label: "Beklemede" },
            { value: "accepted", label: "Kabul Edildi" },
            { value: "rejected", label: "Reddedildi" },
            { value: "countered", label: "Karşı Teklif" }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleStatusFilterChange(filter.value)}
              className={`${styles.filterButton} ${
                statusFilter === filter.value ? styles.active : ""
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Müşteri adı, email veya ürün ara..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>

      <OfferTable
        offers={data.offers}
        onView={handleViewOffer}
        onUpdate={handleUpdateOffer}
        onDelete={handleDeleteOffer}
        isLoading={isRefreshing}
      />

      {data.pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(data.pagination.page - 1)}
            disabled={data.pagination.page === 1}
            className={styles.paginationButton}
          >
            Önceki
          </button>
          <span className={styles.paginationInfo}>
            Sayfa {data.pagination.page} / {data.pagination.pages}
            <span className={styles.paginationTotal}>
              (Toplam {data.pagination.total} teklif)
            </span>
          </span>
          <button
            onClick={() => handlePageChange(data.pagination.page + 1)}
            disabled={data.pagination.page === data.pagination.pages}
            className={styles.paginationButton}
          >
            Sonraki
          </button>
        </div>
      )}

      {isModalOpen && selectedOffer && (
        <OfferModal
          offer={selectedOffer}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOffer(null);
          }}
          onUpdate={handleUpdateOffer}
        />
      )}
    </div>
  );
}
