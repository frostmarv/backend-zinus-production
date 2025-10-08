// migrate.js - Run after TypeORM creates tables
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Koneksi ke dev.sqlite
const db = new sqlite3.Database('./dev.sqlite', (err) => {
    if (err) {
        console.error('❌ Gagal buka database:', err.message);
        process.exit(1);
    }
});

// Baca script SQL untuk data dan views
const dataScript = fs.readFileSync('./setup_dev_db.sql', 'utf8');
const viewScript = fs.readFileSync('./setup_views.sql', 'utf8');

// Jalankan data insertion dulu
db.exec(dataScript, (err) => {
    if (err) {
        console.error('❌ Gagal insert data:', err.message);
        db.close();
        return;
    }
    
    console.log('✅ Data berhasil ditambahkan ke database!');
    
    // Setelah data sukses, buat views
    db.exec(viewScript, (err) => {
        if (err) {
            console.error('❌ Gagal buat views:', err.message);
        } else {
            console.log('✅ Views berhasil dibuat!');
            console.log('✅ Database siap digunakan.');
        }
        db.close();
    });
});
