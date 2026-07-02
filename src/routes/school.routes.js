const router = require('express').Router();
const { authenticateToken: auth } = require('../middlewares/auth');
const { uploadSchoolLogo } = require('../middlewares/upload');
const c      = require('../controllers/school.controller');

router.get('/',       auth, c.getAllSchools);
router.get('/:id',    auth, c.getSchool);
router.post('/',      auth, uploadSchoolLogo, c.createSchool);
router.put('/:id',    auth, uploadSchoolLogo, c.updateSchool);
router.delete('/:id', auth, c.deleteSchool);

module.exports = router;
