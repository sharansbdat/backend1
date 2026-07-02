// src/middlewares/upload.js
const { upload, handleMulterError } = require('../config/upload');

// ─── Student Photo Upload ──────────────────────────────────────────────────
const uploadStudentPhoto = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// ─── Staff Photo Upload ────────────────────────────────────────────────────
const uploadStaffPhoto = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// ─── School Logo Upload ────────────────────────────────────────────────────
const uploadSchoolLogo = (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// ─── Multiple Photos Upload ────────────────────────────────────────────────
const uploadMultiplePhotos = (req, res, next) => {
  upload.array('photos', 5)(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

module.exports = {
  uploadStudentPhoto,
  uploadStaffPhoto,
  uploadSchoolLogo,
  uploadMultiplePhotos
};