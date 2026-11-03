# 🐳 CloudMart — App Repository (Microservices)

Repository monorepo ini berisi source code **4 microservices** dan konfigurasi **CI/CD GitHub Actions**.

---

## 📁 Struktur Microservices

```
app/
├── order-service/          Port 3000 — CRUD order, simpan session, publish SQS
├── notification-service/   Port 3001 — Polling SQS, kirim notifikasi SNS
├── inventory-service/      Port 3002 — Stok barang, Redis caching, upload S3
├── frontend/               Port 80  — Web Dashboard (Nginx + HTML/JS)
└── .github/
    └── workflows/
        ├── classroom.yml          ← ⛔ JANGAN DIUBAH
        └── deploy-template.yml    ← 📋 Salin menjadi 4 workflow deploy
```

---

## 🎯 Tugas Peserta

1. Buka `.github/workflows/deploy-template.yml`.
2. Salin menjadi 4 file terpisah:
   - `deploy-order.yml`
   - `deploy-notification.yml`
   - `deploy-inventory.yml`
   - `deploy-frontend.yml`
3. Sesuaikan parameter `ECR_REPOSITORY`, `ECS_SERVICE`, `ECS_CONTAINER`, `paths`, dan port pada masing-masing file.
4. Hapus file `deploy-template.yml` setelah 4 file workflow berhasil dibuat.
5. Push ke GitHub untuk memicu build container, push ke ECR, dan trigger rolling deployment di ECS Fargate.
