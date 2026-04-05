require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Hospital, Doctor } = require('../models');

/**
 * Sample seed data for LifeLine application
 */

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Hospital.deleteMany({}),
      Doctor.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Hash password
    const hashedPassword = await bcrypt.hash('Password123', 12);

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@lifeline.com',
      phone: '+91-9876543210',
      password: hashedPassword,
      role: 'super_admin',
      isVerified: true,
      isActive: true,
    });
    console.log('Created super admin:', superAdmin.email);

    // Create sample hospitals
    const hospitalsData = [
      {
        name: 'City General Hospital',
        registrationNumber: 'HOS-2024-001',
        type: 'government',
        description: 'Premier government hospital with state-of-the-art facilities',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139], // Delhi
        },
        address: {
          street: '123 Medical Lane',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India',
        },
        contact: {
          phone: '+91-11-23456789',
          emergencyPhone: '+91-11-23456780',
          email: 'cityhospital@health.gov.in',
          website: 'https://cityhospital.gov.in',
        },
        beds: {
          total: 500,
          available: 120,
          icu: { total: 50, available: 10 },
          ventilators: { total: 30, available: 8 },
          emergency: { total: 40, available: 15 },
          general: { total: 300, available: 70 },
          pediatric: { total: 40, available: 12 },
          maternity: { total: 40, available: 5 },
        },
        facilities: ['emergency', 'icu', 'operation_theater', 'laboratory', 'pharmacy', 'blood_bank', 'ambulance'],
        specializations: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine'],
        ambulances: { total: 10, available: 6 },
        verified: true,
        status: 'approved',
        isActive: true,
      },
      {
        name: 'LifeCare Multi-Specialty Hospital',
        registrationNumber: 'HOS-2024-002',
        type: 'private',
        description: 'Premium multi-specialty hospital with world-class infrastructure',
        location: {
          type: 'Point',
          coordinates: [77.2167, 28.6448], // Delhi - Different location
        },
        address: {
          street: '456 Health Avenue',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110002',
          country: 'India',
        },
        contact: {
          phone: '+91-11-87654321',
          emergencyPhone: '+91-11-87654322',
          email: 'info@lifecare.com',
          website: 'https://lifecare.com',
        },
        beds: {
          total: 300,
          available: 85,
          icu: { total: 40, available: 12 },
          ventilators: { total: 25, available: 10 },
          emergency: { total: 30, available: 8 },
          general: { total: 150, available: 45 },
          pediatric: { total: 30, available: 5 },
          maternity: { total: 25, available: 5 },
        },
        facilities: ['emergency', 'icu', 'operation_theater', 'laboratory', 'pharmacy', 'radiology', 'ambulance', 'parking', 'cafeteria'],
        specializations: ['Oncology', 'Cardiology', 'Neurosurgery', 'Gynecology'],
        ambulances: { total: 8, available: 5 },
        verified: true,
        status: 'approved',
        isActive: true,
      },
      {
        name: 'Women & Child Care Hospital',
        registrationNumber: 'HOS-2024-003',
        type: 'charitable',
        description: 'Specialized hospital for women and children healthcare',
        location: {
          type: 'Point',
          coordinates: [77.1025, 28.7041], // Delhi - Different location
        },
        address: {
          street: '789 Care Street',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110003',
          country: 'India',
        },
        contact: {
          phone: '+91-11-11223344',
          emergencyPhone: '+91-11-11223345',
          email: 'care@womenchildhospital.org',
        },
        beds: {
          total: 150,
          available: 40,
          icu: { total: 20, available: 5 },
          ventilators: { total: 10, available: 3 },
          emergency: { total: 15, available: 5 },
          general: { total: 50, available: 12 },
          pediatric: { total: 35, available: 10 },
          maternity: { total: 20, available: 5 },
        },
        facilities: ['emergency', 'icu', 'operation_theater', 'laboratory', 'pharmacy', 'ambulance'],
        specializations: ['Pediatrics', 'Gynecology', 'Obstetrics', 'Neonatology'],
        ambulances: { total: 4, available: 3 },
        verified: true,
        status: 'approved',
        isActive: true,
      },
    ];

    const hospitals = await Hospital.insertMany(hospitalsData);
    console.log(`Created ${hospitals.length} hospitals`);

    // Create Hospital Admins
    for (let i = 0; i < hospitals.length; i++) {
      const hospitalAdmin = await User.create({
        name: `Hospital Admin ${i + 1}`,
        email: `hospital${i + 1}@lifeline.com`,
        phone: `+91-98765432${i}${i}`,
        password: hashedPassword,
        role: 'hospital_admin',
        hospital: hospitals[i]._id,
        isVerified: true,
        isActive: true,
      });

      // Update hospital with admin reference
      await Hospital.findByIdAndUpdate(hospitals[i]._id, { admin: hospitalAdmin._id });
      console.log(`Created hospital admin: ${hospitalAdmin.email}`);
    }

    // Create sample doctors
    const doctorsData = [
      {
        name: 'Dr. Rajesh Kumar',
        registrationNumber: 'DOC-2024-001',
        specialization: 'cardiology',
        qualifications: [
          { degree: 'MBBS', institution: 'AIIMS Delhi', year: 2010 },
          { degree: 'MD Cardiology', institution: 'AIIMS Delhi', year: 2014 },
        ],
        experience: { years: 10, description: 'Senior Cardiologist with expertise in interventional cardiology' },
        hospital: hospitals[0]._id,
        consultation: { fee: 1000, duration: 20, onlineConsultation: true, onlineFee: 800 },
        availabilityStatus: 'available',
        emergencyAvailable: true,
        verified: true,
        status: 'approved',
        isActive: true,
        bio: 'Experienced cardiologist specializing in heart diseases and interventional procedures.',
        languages: ['English', 'Hindi'],
      },
      {
        name: 'Dr. Priya Sharma',
        registrationNumber: 'DOC-2024-002',
        specialization: 'neurology',
        qualifications: [
          { degree: 'MBBS', institution: 'Maulana Azad Medical College', year: 2012 },
          { degree: 'DM Neurology', institution: 'NIMHANS', year: 2018 },
        ],
        experience: { years: 6, description: 'Neurologist specializing in stroke and epilepsy management' },
        hospital: hospitals[0]._id,
        consultation: { fee: 1200, duration: 25, onlineConsultation: true, onlineFee: 1000 },
        availabilityStatus: 'available',
        emergencyAvailable: true,
        verified: true,
        status: 'approved',
        isActive: true,
        bio: 'Expert neurologist with focus on stroke prevention and treatment.',
        languages: ['English', 'Hindi', 'Punjabi'],
      },
      {
        name: 'Dr. Anjali Gupta',
        registrationNumber: 'DOC-2024-003',
        specialization: 'gynecology',
        qualifications: [
          { degree: 'MBBS', institution: 'Lady Hardinge Medical College', year: 2008 },
          { degree: 'MD Gynecology', institution: 'Safdarjung Hospital', year: 2012 },
        ],
        experience: { years: 12, description: 'Senior Gynecologist with expertise in high-risk pregnancies' },
        hospital: hospitals[2]._id,
        consultation: { fee: 800, duration: 15, onlineConsultation: false },
        availabilityStatus: 'available',
        emergencyAvailable: true,
        verified: true,
        status: 'approved',
        isActive: true,
        bio: 'Dedicated to women\'s health with specialization in maternal care.',
        languages: ['English', 'Hindi'],
      },
      {
        name: 'Dr. Amit Patel',
        registrationNumber: 'DOC-2024-004',
        specialization: 'emergency_medicine',
        qualifications: [
          { degree: 'MBBS', institution: 'Grant Medical College Mumbai', year: 2015 },
          { degree: 'MD Emergency Medicine', institution: 'CMC Vellore', year: 2019 },
        ],
        experience: { years: 5, description: 'Emergency medicine specialist with trauma care expertise' },
        hospital: hospitals[1]._id,
        consultation: { fee: 500, duration: 10 },
        availabilityStatus: 'available',
        emergencyAvailable: true,
        currentlyOnDuty: true,
        verified: true,
        status: 'approved',
        isActive: true,
        bio: 'Emergency medicine expert trained in critical care and trauma management.',
        languages: ['English', 'Hindi', 'Gujarati'],
      },
    ];

    // Create doctor users and profiles
    for (const doctorData of doctorsData) {
      const doctorUser = await User.create({
        name: doctorData.name,
        email: doctorData.name.toLowerCase().replace(/[^a-z]/g, '') + '@lifeline.com',
        phone: `+91-9${Math.floor(100000000 + Math.random() * 900000000)}`,
        password: hashedPassword,
        role: 'doctor',
        isVerified: true,
        isActive: true,
      });

      const doctor = await Doctor.create({
        ...doctorData,
        user: doctorUser._id,
      });

      await User.findByIdAndUpdate(doctorUser._id, { doctorProfile: doctor._id });

      // Add doctor to hospital
      await Hospital.findByIdAndUpdate(doctorData.hospital, {
        $push: { doctors: doctor._id },
      });

      console.log(`Created doctor: ${doctor.name}`);
    }

    // Create sample regular users
    const usersData = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91-9988776655',
        password: hashedPassword,
        role: 'user',
        isVerified: true,
        isActive: true,
        address: {
          street: '100 User Lane',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
        },
        emergencyContacts: [
          { name: 'Jane Doe', phone: '+91-9988776644', relation: 'Spouse' },
          { name: 'Mike Doe', phone: '+91-9988776633', relation: 'Brother' },
        ],
        location: {
          type: 'Point',
          coordinates: [77.2200, 28.6200],
        },
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        phone: '+91-9876543211',
        password: hashedPassword,
        role: 'user',
        isVerified: true,
        isActive: true,
        address: {
          street: '200 Citizen Road',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110002',
        },
        emergencyContacts: [
          { name: 'Tom Wilson', phone: '+91-9876543212', relation: 'Father' },
        ],
        location: {
          type: 'Point',
          coordinates: [77.2300, 28.6300],
        },
      },
    ];

    const users = await User.insertMany(usersData);
    console.log(`Created ${users.length} regular users`);

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('----------------------------------------');
    console.log('Super Admin:');
    console.log('  Email: admin@lifeline.com');
    console.log('  Password: Password123');
    console.log('\nHospital Admins:');
    console.log('  Email: hospital1@lifeline.com - hospital3@lifeline.com');
    console.log('  Password: Password123');
    console.log('\nDoctors:');
    console.log('  Email: drrajeshkumar@lifeline.com, etc.');
    console.log('  Password: Password123');
    console.log('\nRegular Users:');
    console.log('  Email: john@example.com, sarah@example.com');
    console.log('  Password: Password123');
    console.log('----------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

// Run seeder
seedData();
