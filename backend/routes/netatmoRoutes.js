const express = require('express');
const router = express.Router();

const axios = require("axios");

const netatmoController = require("../controllers/netatmoController");


router.get("/init", netatmoController.netatmoInit);

router.get("/homes", netatmoController.netatmoGetHomes);

router.get('/status/:homeId', netatmoController.netatmoGetHomeStatus);

router.post('/setstate', netatmoController.netatmoSetThermostatState);

router.post('/switchschedule', netatmoController.netatmoSwitchSchedule);

router.post('/syncschedule', netatmoController.netatmoSyncSchedule);

router.post('/boostheating', netatmoController.netatmoBoostHeating);

router.post('/setschedule', netatmoController.netatmoCreateSchedule);

router.post('/switchhomeschedule', netatmoController.netatmoSwitchHomeSchedule);

module.exports = router;