import { json } from "@remix-run/node";
import prisma from "../../db.server";

// GET - Tüm teklifleri listele
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { productTitle: { contains: search } }
      ];
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          logs: {
            orderBy: { createdAt: "desc" },
            take: 5
          }
        }
      }),
      prisma.offer.count({ where })
    ]);

    return json({
      success: true,
      data: offers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Offers GET error:", error);
    return json(
      { success: false, error: "Teklifler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// POST - Yeni teklif oluştur
export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const data = await request.json();

    // Validasyon
    const required = ["customerName", "customerEmail", "productId", "productTitle", "originalPrice", "offerPrice"];
    for (const field of required) {
      if (!data[field]) {
        return json(
          { success: false, error: `${field} alanı gereklidir` },
          { status: 400 }
        );
      }
    }

    if (data.offerPrice <= 0) {
      return json(
        { success: false, error: "Teklif fiyatı 0'dan büyük olmalıdır" },
        { status: 400 }
      );
    }

    if (data.offerPrice >= data.originalPrice) {
      return json(
        { success: false, error: "Teklif fiyatı orijinal fiyattan düşük olmalıdır" },
        { status: 400 }
      );
    }

    // Email validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.customerEmail)) {
      return json(
        { success: false, error: "Geçerli bir email adresi giriniz" },
        { status: 400 }
      );
    }

    // Teklif oluştur
    const offer = await prisma.offer.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        productId: data.productId,
        productTitle: data.productTitle,
        productImage: data.productImage || null,
        variantId: data.variantId || null,
        variantTitle: data.variantTitle || null,
        originalPrice: parseFloat(data.originalPrice),
        offerPrice: parseFloat(data.offerPrice),
        quantity: parseInt(data.quantity) || 1,
        message: data.message || null,
        status: "pending",
        logs: {
          create: {
            action: "created",
            newValue: "pending",
            performedBy: "customer"
          }
        }
      },
      include: {
        logs: true
      }
    });

    return json({ success: true, data: offer }, { status: 201 });
  } catch (error) {
    console.error("Offer POST error:", error);
    return json(
      { success: false, error: "Teklif oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}
