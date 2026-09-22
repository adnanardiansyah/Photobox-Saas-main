PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0ea5e9',
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Tenant VALUES('cmnlwogcb0000bzegk243pixa','SnapNext Demo','admin@snapnext.id','+6281234567890','/logo.png','#9333ea','PRO',1,1775402282171,1775402282171);
CREATE TABLE IF NOT EXISTS "Outlet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "operatingHours" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "machineId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outlet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO Outlet VALUES('cmnlwoghy0004bzegyibfdn3n','cmnlwogcb0000bzegk243pixa','SnapNext Aceh Utara','Jl. Tengku Amir Hamzah, Banda Aceh, Aceh','+6281234567891',5.5576999999999996404,95.319299999999998361,'{"monday":"09:00-21:00","tuesday":"09:00-21:00","wednesday":"09:00-21:00","thursday":"09:00-21:00","friday":"09:00-22:00","saturday":"09:00-22:00","sunday":"10:00-20:00"}',1,'BOOTH-ACEH-001',1775402282374,1775402282374);
INSERT INTO Outlet VALUES('cmnlwogi90006bzeg3kck612z','cmnlwogcb0000bzegk243pixa','SnapNext Lhokseumawe','Jl. Merdeka, Lhokseumawe, Aceh','+6281234567892',5.1897000000000002017,97.135099999999994224,'{"monday":"08:00-22:00","tuesday":"08:00-22:00","wednesday":"08:00-22:00","thursday":"08:00-22:00","friday":"08:00-23:00","saturday":"08:00-23:00","sunday":"09:00-21:00"}',1,'BOOTH-LHOKSEUMAWE-001',1775402282385,1775402282385);
CREATE TABLE IF NOT EXISTS "OutletConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outletId" TEXT NOT NULL,
    "paymentMethods" TEXT NOT NULL DEFAULT '{"cash": true, "qris": true, "voucher": true}',
    "priceDefault" REAL NOT NULL DEFAULT 0,
    "printEnabled" BOOLEAN NOT NULL DEFAULT true,
    "galleryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "gifEnabled" BOOLEAN NOT NULL DEFAULT true,
    "newspaperEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OutletConfig_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO OutletConfig VALUES('cmnlwogii0008bzeg479nasle','cmnlwoghy0004bzegyibfdn3n','{"cash":true,"qris":true,"voucher":true}',25000.0,1,1,1,1,1775402282395,1775402282395);
INSERT INTO OutletConfig VALUES('cmnlwogir000abzeg41hijebu','cmnlwogi90006bzeg3kck612z','{"cash":true,"qris":true,"voucher":true}',25000.0,1,1,1,0,1775402282403,1775402282403);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "outletId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "User_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO User VALUES('cmnlwogfw0002bzegjtjy8az7','cmnlwogcb0000bzegk243pixa',NULL,'admin@snapnext.id','$2a$10$R.tqJCYrUX82h/bUP.c4A.sbmWYKsD1bFaYZ49.NAJHCBw.0a/5Wi','Admin SnapNext','OWNER',1,NULL,1775402282300,1775402282300);
CREATE TABLE IF NOT EXISTS "FrameTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FOUR_R',
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FrameTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO FrameTemplate VALUES('frame-a4-newspaper-001','cmnlwogcb0000bzegk243pixa','A4 Newspaper Edition','A4_NEWSPAPER','/frames/newspaper-a4.png','/frames/thumb-newspaper-a4.png',2480,3508,35000.0,1,1775402282414,1775402282414);
INSERT INTO FrameTemplate VALUES('frame-4r-classic-001','cmnlwogcb0000bzegk243pixa','4R Classic','FOUR_R','/frames/4r-classic.png','/frames/thumb-4r-classic.png',1200,1800,25000.0,1,1775402282423,1775402282423);
INSERT INTO FrameTemplate VALUES('frame-gif-animated-001','cmnlwogcb0000bzegk243pixa','GIF Animated Frame','CUSTOM','/frames/gif-animated.png','/frames/thumb-gif-animated.png',1080,1080,30000.0,1,1775402282431,1775402282431);
CREATE TABLE IF NOT EXISTS "SessionPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outletId" TEXT NOT NULL,
    "frameId" TEXT,
    "sessionCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CAPTURING',
    "photos" TEXT NOT NULL,
    "gifUrl" TEXT,
    "newspaperUrl" TEXT,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentRef" TEXT,
    "voucherCode" TEXT,
    "galleryCode" TEXT NOT NULL,
    "galleryExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "SessionPhoto_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionPhoto_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "FrameTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO SessionPhoto VALUES('cmnlwogmn000wbzegun01tzxm','cmnlwoghy0004bzegyibfdn3n','frame-4r-classic-001','SESSION-ACEH-001','COMPLETED','["https://picsum.photos/400/600?random=1","https://picsum.photos/400/600?random=2","https://picsum.photos/400/600?random=3","https://picsum.photos/400/600?random=4"]','https://picsum.photos/400/600?random=gif1',NULL,25000.0,'CASH','COMPLETED',NULL,NULL,'ABC123DEF456',1776007082541,1775402282543,NULL);
INSERT INTO SessionPhoto VALUES('cmnlwogmx000ybzeg5ouumc8r','cmnlwogi90006bzeg3kck612z','frame-a4-newspaper-001','SESSION-LHOK-001','COMPLETED','["https://picsum.photos/400/600?random=5","https://picsum.photos/400/600?random=6","https://picsum.photos/400/600?random=7","https://picsum.photos/400/600?random=8"]',NULL,'/photos/sample-newspaper.pdf',35000.0,'QRIS','COMPLETED',NULL,NULL,'XYZ789UVW012',1776007082551,1775402282553,NULL);
INSERT INTO SessionPhoto VALUES('cmnlwogn50010bzegd50aghn6','cmnlwoghy0004bzegyibfdn3n','frame-gif-animated-001','SESSION-ACEH-002','COMPLETED','["https://picsum.photos/400/600?random=9","https://picsum.photos/400/600?random=10"]','https://picsum.photos/400/600?random=gif2',NULL,30000.0,'CASH','COMPLETED',NULL,'WELCOME20','DEMO1234ABCD',1776007082559,1775402282561,NULL);
INSERT INTO SessionPhoto VALUES('cmnlxfyqi0001ezr3q69pi9qo','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-ZEF866-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'ZEF866',1776008365721,1775403565722,NULL);
INSERT INTO SessionPhoto VALUES('cmnlxfyui0003ezr3fpttfxnq','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-ZQR484-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'ZQR484',1776008365865,1775403565866,NULL);
INSERT INTO SessionPhoto VALUES('cmnlxfyx60005ezr3igccxdt2','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-DNH379-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'DNH379',1776008365960,1775403565962,NULL);
INSERT INTO SessionPhoto VALUES('cmnlxkckl0001p5ub1cjoxcba','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-SXE755-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'SXE755',1776008570273,1775403770277,NULL);
INSERT INTO SessionPhoto VALUES('cmnlxkcq60003p5ub5zeql96w','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-VAH977-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'VAH977',1776008570476,1775403770478,NULL);
INSERT INTO SessionPhoto VALUES('cmnlxkcun0005p5ubl5q5fcly','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-NGW735-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'NGW735',1776008570637,1775403770640,NULL);
INSERT INTO SessionPhoto VALUES('cmnlxkd7a0007p5ubfi26kkp5','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-YJM903-001','COMPLETED','["/photos/SXE755-1775403770370.jpg","/photos/VAH977-1775403770569.jpg","/photos/NGW735-1775403770689.jpg"]',NULL,NULL,50000.0,NULL,'COMPLETED',NULL,NULL,'YJM903',1776008571092,1775403771094,NULL);
INSERT INTO SessionPhoto VALUES('cmnly1oc80001onb4x6qs9qyb','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-YNX094-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'YNX094',1776009378677,1775404578679,NULL);
INSERT INTO SessionPhoto VALUES('cmnly1ofv0003onb4ej0kkbjx','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-VUU371-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'VUU371',1776009378810,1775404578812,NULL);
INSERT INTO SessionPhoto VALUES('cmnly1oi90005onb4mrnhw0uz','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-SXK530-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'SXK530',1776009378895,1775404578897,NULL);
INSERT INTO SessionPhoto VALUES('cmnly1osd0007onb40i2eax17','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-TLB300-001','COMPLETED','["/photos/YNX094-1775404578752.jpg","/photos/VUU371-1775404578837.jpg","/photos/SXK530-1775404578926.jpg"]',NULL,NULL,50000.0,NULL,'COMPLETED',NULL,NULL,'TLB300',1776009379260,1775404579261,NULL);
INSERT INTO SessionPhoto VALUES('cmo5r323900012bh05vsscx33','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-SJS084-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'SJS084',1777207009362,1776602209364,NULL);
INSERT INTO SessionPhoto VALUES('cmo5r327o00032bh0rud35lo5','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-QOU647-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'QOU647',1777207009515,1776602209524,NULL);
INSERT INTO SessionPhoto VALUES('cmo5r32bw00052bh0bsqo84ef','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-WZX626-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'WZX626',1777207009674,1776602209676,NULL);
INSERT INTO SessionPhoto VALUES('cmo5r33m400072bh0c4ctngwr','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-TLC678-001','COMPLETED','["/photos/SJS084-1776602209404.jpg","/photos/QOU647-1776602209586.jpg","/photos/WZX626-1776602209720.jpg"]',NULL,NULL,50000.0,NULL,'COMPLETED',NULL,NULL,'TLC678',1777207011338,1776602211340,NULL);
INSERT INTO SessionPhoto VALUES('cmofdjeb00001apgg0in50sfi','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-VQU230-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'VQU230',1777788918824,1777184118828,NULL);
INSERT INTO SessionPhoto VALUES('cmofdjecr0003apgg95l195d4','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-JAF909-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'JAF909',1777788918887,1777184118891,NULL);
INSERT INTO SessionPhoto VALUES('cmofdjeeo0005apggp1ogr5ua','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-AJO703-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'AJO703',1777788918957,1777184118960,NULL);
INSERT INTO SessionPhoto VALUES('cmofdjeow0007apggsg2a4peu','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-PKH166-001','COMPLETED','["/photos/VQU230-1777184118838.jpg","/photos/JAF909-1777184118903.jpg","/photos/AJO703-1777184118975.jpg"]',NULL,NULL,50000.0,NULL,'COMPLETED',NULL,NULL,'PKH166',1777788919324,1777184119328,NULL);
INSERT INTO SessionPhoto VALUES('cmor59lwa0001v45issi72aia','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-BJI819-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'BJI819',1778500619288,1777895819290,NULL);
INSERT INTO SessionPhoto VALUES('cmor59lyp0003v45ibpddgmt5','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-UYN872-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'UYN872',1778500619375,1777895819377,NULL);
INSERT INTO SessionPhoto VALUES('cmor59m190005v45ialboehym','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-RBC444-001','CAPTURING','[]',NULL,NULL,0.0,NULL,'PENDING',NULL,NULL,'RBC444',1778500619467,1777895819469,NULL);
INSERT INTO SessionPhoto VALUES('cmor59me20007v45iqrmcydyt','cmnlwoghy0004bzegyibfdn3n',NULL,'SESSION-BTC597-001','COMPLETED','["/photos/BJI819-1777895819301.jpg","/photos/UYN872-1777895819391.jpg","/photos/RBC444-1777895819484.jpg"]',NULL,NULL,50000.0,NULL,'COMPLETED',NULL,NULL,'BTC597',1778500619928,1777895819930,NULL);
CREATE TABLE IF NOT EXISTS "Voucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value" REAL NOT NULL,
    "minOrder" REAL NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "usageType" TEXT NOT NULL DEFAULT 'MULTI_USE',
    "validFrom" DATETIME NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Voucher_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO Voucher VALUES('cmnlwogjv000cbzeg55du13ro','cmnlwogcb0000bzegk243pixa','WELCOME20','PERCENTAGE',20.0,20000.0,100,0,'SINGLE_USE',1775402282438,1777994282438,1,1775402282443,1775402282443);
INSERT INTO Voucher VALUES('cmnlwogk4000ebzegn6bn853j','cmnlwogcb0000bzegk243pixa','HARGA25K','FIXED',5000.0,25000.0,NULL,0,'MULTI_USE',1775402282450,1780586282450,1,1775402282453,1775402282453);
INSERT INTO Voucher VALUES('cmnlwogkd000gbzegyrlzdxsf','cmnlwogcb0000bzegk243pixa','GRATIS10K','FIXED',10000.0,30000.0,50,0,'SINGLE_USE',1775402282459,1776611882459,1,1775402282461,1775402282461);
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outletId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentGateway" TEXT,
    "transactionRef" TEXT,
    "qrisString" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    CONSTRAINT "Transaction_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SessionPhoto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "BoothHeartbeat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "machineId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "cpuUsage" REAL,
    "memoryUsage" REAL,
    "diskUsage" REAL,
    "lastPhotoTime" DATETIME,
    "lastSeen" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoothHeartbeat_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "GalleryQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PHOTO',
    "localPath" TEXT NOT NULL,
    "cloudUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "outletId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhoto" TEXT,
    "message" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Testimonial_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Testimonial_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO Testimonial VALUES('cmnlwogkm000ibzeg5xslivyj','cmnlwogcb0000bzegk243pixa','cmnlwoghy0004bzegyibfdn3n','Ahmad Yusuf','/testimonials/ahmad.jpg','Sangat enjoy! Foto hasilnya bagus dan prosesnya cepat. recommend banget!',5,1,1775402282471);
INSERT INTO Testimonial VALUES('cmnlwogku000kbzegd0jgu1cv','cmnlwogcb0000bzegk243pixa','cmnlwogi90006bzeg3kck612z','Siti Aminah',NULL,'Pertama kali coba photo booth, langsung jadi fans. Frame-nya aesthetic bgtt!',5,1,1775402282478);
INSERT INTO Testimonial VALUES('cmnlwogl3000mbzeglsssgb83','cmnlwogcb0000bzegk243pixa','cmnlwoghy0004bzegyibfdn3n','Budi Santoso',NULL,'Bagus untuk acara keluarga. Anak-anak suka banget.',4,1,1775402282487);
INSERT INTO Testimonial VALUES('cmnlxqf9g000i825zuyxermru','cmnlwogcb0000bzegk243pixa','cmnlwoghy0004bzegyibfdn3n','Ahmad Yusuf','/testimonials/ahmad.jpg','Sangat enjoy! Foto hasilnya bagus dan prosesnya cepat. recommend banget!',5,1,1775404053700);
INSERT INTO Testimonial VALUES('cmnlxqf9s000k825z3djaoy2o','cmnlwogcb0000bzegk243pixa','cmnlwogi90006bzeg3kck612z','Siti Aminah',NULL,'Pertama kali coba photo booth, langsung jadi fans. Frame-nya aesthetic bgtt!',5,1,1775404053712);
INSERT INTO Testimonial VALUES('cmnlxqfa2000m825zcjtlx84d','cmnlwogcb0000bzegk243pixa','cmnlwoghy0004bzegyibfdn3n','Budi Santoso',NULL,'Bagus untuk acara keluarga. Anak-anak suka banget.',4,1,1775404053723);
CREATE TABLE IF NOT EXISTS "BrandAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LOGO',
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrandAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO BrandAsset VALUES('cmnlwogle000obzegwnykueu2','cmnlwogcb0000bzegk243pixa','HERO_IMAGE','/brand/hero-default.jpg',1,1775402282498,1775402282498);
INSERT INTO BrandAsset VALUES('cmnlwogln000qbzegjc5rmtor','cmnlwogcb0000bzegk243pixa','LOGO','/brand/logo.png',1,1775402282507,1775402282507);
INSERT INTO BrandAsset VALUES('cmnlwoglv000sbzegycej7uip','cmnlwogcb0000bzegk243pixa','FAVICON','/brand/favicon.ico',1,1775402282515,1775402282515);
INSERT INTO BrandAsset VALUES('cmnlxqfaf000o825zf9eukl9o','cmnlwogcb0000bzegk243pixa','HERO_IMAGE','/brand/hero-default.jpg',1,1775404053736,1775404053736);
INSERT INTO BrandAsset VALUES('cmnlxqfaq000q825z2w37sufe','cmnlwogcb0000bzegk243pixa','LOGO','/brand/logo.png',1,1775404053746,1775404053746);
INSERT INTO BrandAsset VALUES('cmnlxqfb3000s825zd7an2fb9','cmnlwogcb0000bzegk243pixa','FAVICON','/brand/favicon.ico',1,1775404053759,1775404053759);
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME
);
INSERT INTO ApiKey VALUES('cmnlwogm5000tbzegywu02o2e','demo-key-booth-aceh-001','cmnlwoghy0004bzegyibfdn3n','Aceh Utara Booth','["capture","upload","print"]',1,NULL,1775402282525,NULL);
INSERT INTO ApiKey VALUES('cmnlwogme000ubzeg8288muv5','demo-key-booth-lhokseumawe-001','cmnlwogi90006bzeg3kck612z','Lhokseumawe Booth','["capture","upload","print"]',1,NULL,1775402282534,NULL);
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");
CREATE UNIQUE INDEX "Outlet_machineId_key" ON "Outlet"("machineId");
CREATE INDEX "Outlet_tenantId_idx" ON "Outlet"("tenantId");
CREATE INDEX "Outlet_machineId_idx" ON "Outlet"("machineId");
CREATE UNIQUE INDEX "OutletConfig_outletId_key" ON "OutletConfig"("outletId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_outletId_idx" ON "User"("outletId");
CREATE INDEX "FrameTemplate_tenantId_idx" ON "FrameTemplate"("tenantId");
CREATE UNIQUE INDEX "SessionPhoto_sessionCode_key" ON "SessionPhoto"("sessionCode");
CREATE UNIQUE INDEX "SessionPhoto_galleryCode_key" ON "SessionPhoto"("galleryCode");
CREATE INDEX "SessionPhoto_outletId_status_idx" ON "SessionPhoto"("outletId", "status");
CREATE INDEX "SessionPhoto_sessionCode_idx" ON "SessionPhoto"("sessionCode");
CREATE INDEX "SessionPhoto_galleryCode_idx" ON "SessionPhoto"("galleryCode");
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");
CREATE INDEX "Voucher_tenantId_idx" ON "Voucher"("tenantId");
CREATE INDEX "Voucher_code_idx" ON "Voucher"("code");
CREATE UNIQUE INDEX "Transaction_sessionId_key" ON "Transaction"("sessionId");
CREATE INDEX "Transaction_outletId_createdAt_idx" ON "Transaction"("outletId", "createdAt");
CREATE INDEX "BoothHeartbeat_machineId_lastSeen_idx" ON "BoothHeartbeat"("machineId", "lastSeen");
CREATE INDEX "BoothHeartbeat_outletId_idx" ON "BoothHeartbeat"("outletId");
CREATE INDEX "Testimonial_tenantId_idx" ON "Testimonial"("tenantId");
CREATE INDEX "BrandAsset_tenantId_idx" ON "BrandAsset"("tenantId");
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");
CREATE INDEX "ApiKey_outletId_idx" ON "ApiKey"("outletId");
COMMIT;
