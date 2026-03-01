require('dotenv').config();
const { sequelize, User, Mold, MaintenanceRequest, WorkOrder, MoldHistory } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Drop everything and recreate schema (clean slate for Supabase)
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    console.log('✅ Cleaned up old tables and ENUM types');

    await sequelize.sync({ force: true });
    console.log('✅ Tables created');

    // Users
    const admin = await User.create({ employeeId: 'EMP001', username: 'admin', password: 'admin123', firstName: 'Admin', lastName: 'System', email: 'admin@moldshop.com', phone: '081-000-0001', role: 'admin', department: 'Moldshop' });
    const manager = await User.create({ employeeId: 'EMP002', username: 'somchai', password: 'pass123', firstName: 'สมชาย', lastName: 'มั่นคง', email: 'somchai@moldshop.com', phone: '081-000-0002', role: 'manager', department: 'Moldshop' });
    const tech1 = await User.create({ employeeId: 'EMP003', username: 'somying', password: 'pass123', firstName: 'สมหญิง', lastName: 'ใจดี', email: 'somying@moldshop.com', phone: '081-000-0003', role: 'technician', department: 'Moldshop' });
    const tech2 = await User.create({ employeeId: 'EMP004', username: 'wichai', password: 'pass123', firstName: 'วิชัย', lastName: 'เก่งกล้า', email: 'wichai@moldshop.com', phone: '081-000-0004', role: 'technician', department: 'Moldshop' });
    const op1 = await User.create({ employeeId: 'EMP005', username: 'somsri', password: 'pass123', firstName: 'สมศรี', lastName: 'รักงาน', email: 'somsri@moldshop.com', phone: '081-000-0005', role: 'operator', department: 'Moldshop' });
    console.log('✅ Users seeded');

    // Molds
    const molds = await Mold.bulkCreate([
      { moldCode: 'MOLD-001', name: 'Body Front Cover', customer: 'Toyota', partNumber: 'TYT-FC-2024-001', partName: 'Front Cover Assembly', cavity: 4, material: 'NAK80', weight: 2500, sizeWidth: 800, sizeLength: 600, sizeHeight: 500, machineType: 'Injection 850T', cycleTime: 45, shotCount: 125000, maxShot: 500000, location: 'Rack A-01', status: 'active', lastMaintenanceDate: '2026-02-01', nextMaintenanceDate: '2026-03-01' },
      { moldCode: 'MOLD-002', name: 'Bumper LH', customer: 'Honda', partNumber: 'HND-BL-2024-001', partName: 'Bumper Left Hand', cavity: 2, material: 'SKD61', weight: 3200, sizeWidth: 1200, sizeLength: 800, sizeHeight: 600, machineType: 'Injection 1300T', cycleTime: 60, shotCount: 85000, maxShot: 400000, location: 'Machine #3', status: 'in_use', lastMaintenanceDate: '2026-01-15', nextMaintenanceDate: '2026-02-28' },
      { moldCode: 'MOLD-003', name: 'Dashboard Panel', customer: 'Nissan', partNumber: 'NSN-DP-2023-005', partName: 'Dashboard Panel Upper', cavity: 1, material: 'NAK80', weight: 4500, sizeWidth: 1400, sizeLength: 900, sizeHeight: 700, machineType: 'Injection 1800T', cycleTime: 75, shotCount: 200000, maxShot: 350000, location: 'ห้องซ่อม', status: 'maintenance', lastMaintenanceDate: '2026-02-10', nextMaintenanceDate: '2026-02-25' },
      { moldCode: 'MOLD-004', name: 'Door Handle RH', customer: 'Suzuki', partNumber: 'SZK-DH-2024-002', partName: 'Door Handle Right', cavity: 8, material: 'S136', weight: 800, sizeWidth: 400, sizeLength: 350, sizeHeight: 300, machineType: 'Injection 280T', cycleTime: 25, shotCount: 310000, maxShot: 600000, location: 'Rack B-03', status: 'active', lastMaintenanceDate: '2026-02-05', nextMaintenanceDate: '2026-03-05' },
      { moldCode: 'MOLD-005', name: 'Headlamp Housing', customer: 'Toyota', partNumber: 'TYT-HL-2023-003', partName: 'Headlamp Housing LH', cavity: 2, material: 'NAK80', weight: 1800, sizeWidth: 600, sizeLength: 500, sizeHeight: 450, machineType: 'Injection 650T', cycleTime: 50, shotCount: 280000, maxShot: 300000, location: 'Rack C-05', status: 'damaged', lastMaintenanceDate: '2026-01-20' },
      { moldCode: 'MOLD-006', name: 'Mirror Base', customer: 'Honda', partNumber: 'HND-MB-2024-001', partName: 'Side Mirror Base', cavity: 4, material: 'S136', weight: 600, sizeWidth: 350, sizeLength: 300, sizeHeight: 250, machineType: 'Injection 180T', cycleTime: 20, shotCount: 50000, maxShot: 500000, location: 'Rack A-08', status: 'active', lastMaintenanceDate: '2026-02-12', nextMaintenanceDate: '2026-03-12' },
      { moldCode: 'MOLD-007', name: 'Fender Liner', customer: 'Isuzu', partNumber: 'ISZ-FL-2024-001', partName: 'Front Fender Liner', cavity: 1, material: 'P20', weight: 2800, sizeWidth: 900, sizeLength: 700, sizeHeight: 550, machineType: 'Injection 1000T', cycleTime: 55, shotCount: 30000, maxShot: 400000, location: 'Machine #7', status: 'in_use', lastMaintenanceDate: '2026-02-08', nextMaintenanceDate: '2026-03-08' },
      { moldCode: 'MOLD-008', name: 'Grille Front', customer: 'Toyota', partNumber: 'TYT-GF-2024-002', partName: 'Front Grille Assembly', cavity: 2, material: 'NAK80', weight: 1500, sizeWidth: 700, sizeLength: 500, sizeHeight: 400, machineType: 'Injection 650T', cycleTime: 40, shotCount: 90000, maxShot: 450000, location: 'Rack D-02', status: 'active', lastMaintenanceDate: '2026-02-14', nextMaintenanceDate: '2026-03-14' },
    ]);
    console.log('✅ Molds seeded');

    // Maintenance Requests
    await MaintenanceRequest.bulkCreate([
      { requestCode: 'MT-0001', moldId: molds[0].id, type: 'repair', description: 'เปลี่ยน Core Pin #3 สึกหรอ', priority: 'high', status: 'in_progress', requestedById: op1.id, assignedToId: tech1.id, dueDate: '2026-02-20' },
      { requestCode: 'MT-0002', moldId: molds[1].id, type: 'pm', description: 'ทำความสะอาด + ทาน้ำมันกันสนิม', priority: 'normal', status: 'completed', requestedById: manager.id, assignedToId: tech2.id, dueDate: '2026-02-16', completedDate: '2026-02-16' },
      { requestCode: 'MT-0003', moldId: molds[2].id, type: 'repair', description: 'ซ่อม Cooling Channel รั่ว', priority: 'urgent', status: 'pending', requestedById: tech2.id, dueDate: '2026-02-19' },
      { requestCode: 'MT-0004', moldId: molds[3].id, type: 'inspection', description: 'ตรวจสอบ Ejector System ทำงานผิดปกติ', priority: 'normal', status: 'in_progress', requestedById: op1.id, assignedToId: tech1.id, dueDate: '2026-02-21' },
      { requestCode: 'MT-0005', moldId: molds[7].id, type: 'pm', description: 'บำรุงรักษาตามแผน 50,000 shot', priority: 'normal', status: 'pending', requestedById: manager.id, dueDate: '2026-02-25' },
      { requestCode: 'MT-0006', moldId: molds[4].id, type: 'repair', description: 'Cavity แตก - ต้องทำ Cavity ใหม่', priority: 'high', status: 'pending', requestedById: tech1.id, dueDate: '2026-03-01' },
    ]);
    console.log('✅ Maintenance requests seeded');

    // Work Orders
    await WorkOrder.bulkCreate([
      { orderCode: 'WO-2026-001', moldId: null, title: 'สร้างแม่พิมพ์ใหม่ Part A - Tail Lamp Housing', type: 'new_mold', description: 'สร้างแม่พิมพ์ Tail Lamp Housing สำหรับลูกค้า Toyota', priority: 'high', status: 'machine_mold', progress: 35, assignedToId: tech1.id, createdById: manager.id, startDate: '2026-02-10', dueDate: '2026-03-15' },
      { orderCode: 'WO-2026-002', moldId: molds[1].id, title: 'แก้ไข Cavity Surface MOLD-002', type: 'modify', description: 'ขัดผิว Cavity ให้ได้ค่า Ra ตามสเปค', priority: 'normal', status: 'completed', progress: 100, assignedToId: tech2.id, createdById: manager.id, startDate: '2026-02-12', dueDate: '2026-02-18', completedDate: '2026-02-17' },
      { orderCode: 'WO-2026-003', moldId: null, title: 'ทดสอบ Trial Run แม่พิมพ์ใหม่', type: 'trial', description: 'Trial Run แม่พิมพ์ที่สร้างใหม่จาก WO-2026-001', priority: 'normal', status: 'mold_design', progress: 0, createdById: manager.id, dueDate: '2026-03-20' },
      { orderCode: 'WO-2026-004', moldId: molds[2].id, title: 'ปรับปรุง Cooling System MOLD-003', type: 'improvement', description: 'เพิ่ม Cooling Channel เพื่อลด Cycle Time', priority: 'high', status: 'finishing_mold', progress: 60, assignedToId: tech1.id, createdById: manager.id, startDate: '2026-02-17', dueDate: '2026-02-25' },
      { orderCode: 'WO-2026-005', moldId: molds[4].id, title: 'ทำ Cavity ใหม่ทดแทน MOLD-005', type: 'repair', description: 'Cavity เดิมแตก ต้องผลิตใหม่', priority: 'urgent', status: 'mold_design', progress: 0, createdById: tech1.id, dueDate: '2026-03-01' },
    ]);
    console.log('✅ Work orders seeded');

    // Mold History
    await MoldHistory.bulkCreate([
      { moldId: molds[0].id, action: 'production', description: 'ใช้งานผลิต Machine #3 - Lot TYT-1234', performedById: tech2.id, machineNo: 'Machine #3', lotNumber: 'TYT-1234', shotsBefore: 120000, shotsAfter: 125000 },
      { moldId: molds[0].id, action: 'return', description: 'คืนแม่พิมพ์จาก Machine #3', performedById: tech1.id },
      { moldId: molds[0].id, action: 'maintenance', description: 'PM ตามแผน - ทำความสะอาด', performedById: tech2.id },
      { moldId: molds[1].id, action: 'checkout', description: 'เบิกไปใช้งาน Machine #3', performedById: tech2.id, machineNo: 'Machine #3' },
      { moldId: molds[2].id, action: 'status_change', description: 'เปลี่ยนสถานะเป็นกำลังซ่อม', performedById: manager.id },
      { moldId: molds[4].id, action: 'status_change', description: 'Cavity แตก - เปลี่ยนสถานะเป็นชำรุด', performedById: tech1.id },
    ]);
    console.log('✅ Mold history seeded');

    console.log('\n🎉 Seed completed successfully!');
    console.log('👤 Login credentials:');
    console.log('   admin / admin123 (Admin)');
    console.log('   somchai / pass123 (Manager)');
    console.log('   somying / pass123 (Technician)');
    console.log('   wichai / pass123 (Technician)');
    console.log('   somsri / pass123 (Operator)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
