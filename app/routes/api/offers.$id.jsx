import { json } from "@remix-run/node";
import prisma from "../../db.server";

// GET - Tek bir teklifi getir
export async function loader({ params }) {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        logs: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!offer) {
      return json(
        { success: false, error: "Teklif bulunamadı" },
        { status: 404 }
      );
    }

    return json({ success: true, data: offer });
  } catch (error) {
    console.error("Offer GET error:", error);
    return json(
      { success: false, error: "Teklif yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT - Teklifi güncelle
export async function action({ request, params }) {
  if (request.method === "PUT") {
    try {
      const data = await request.json();
      const existingOffer = await prisma.offer.findUnique({
        where: { id: params.id }
      });

      if (!existingOffer) {
        return json(
          { success: false, error: "Teklif bulunamadı" },
          { status: 404 }
        );
      }

      const updates = {};
      const logs = [];

      // Status değişikliği
      if (data.status && data.status !== existingOffer.status) {
        updates.status = data.status;
        logs.push({
          action: "status_changed",
          oldValue: existingOffer.status,
          newValue: data.status,
          performedBy: "admin"
        });
      }

      // Karşı teklif
      if (data.counterPrice !== undefined && data.counterPrice !== existingOffer.counterPrice) {
        updates.counterPrice = parseFloat(data.counterPrice);
        logs.push({
          action: "price_updated",
          oldValue: existingOffer.counterPrice?.toString() || "null",
          newValue: data.counterPrice.toString(),
          performedBy: "admin"
        });
      }

      // Admin notları
      if (data.adminNotes !== undefined && data.adminNotes !== existingOffer.adminNotes) {
        updates.adminNotes = data.adminNotes;
        logs.push({
          action: "note_added",
          newValue: data.adminNotes,
          performedBy: "admin"
        });
      }

      // Güncelleme yap
      const offer = await prisma.offer.update({
        where: { id: params.id },
        data: {
          ...updates,
          logs: {
            create: logs
          }
        },
        include: {
          logs: {
            orderBy: { createdAt: "desc" }
          }
        }
      });

      return json({ success: true, data: offer });
    } catch (error) {
      console.error("Offer PUT error:", error);
      return json(
        { success: false, error: "Teklif güncellenirken hata oluştu" },
        { status: 500 }
      );
    }
  }

  // DELETE - Teklifi sil
  if (request.method === "DELETE") {
    try {
      const offer = await prisma.offer.findUnique({
        where: { id: params.id }
      });

      if (!offer) {
        return json(
          { success: false, error: "Teklif bulunamadı" },
          { status: 404 }
        );
      }

      await prisma.offer.delete({
        where: { id: params.id }
      });

      return json({ success: true, message: "Teklif silindi" });
    } catch (error) {
      console.error("Offer DELETE error:", error);
      return json(
        { success: false, error: "Teklif silinirken hata oluştu" },
        { status: 500 }
      );
    }
  }

  return json({ success: false, error: "Method not allowed" }, { status: 405 });
}
