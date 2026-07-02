const router = require('express').Router();
const { authenticateToken: auth } = require('../middlewares/auth');
const c = require('../controllers/staff.controller');

router.get('/',       auth, c.getAllStaff);
router.get('/:id',    auth, c.getStaff);
router.post('/',      auth, c.createStaff);
router.put('/:id',    auth, c.updateStaff);
router.delete('/:id', auth, c.deleteStaff);

module.exports = router;