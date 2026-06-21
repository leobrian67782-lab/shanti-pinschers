const Puppy = require('../models/Puppy');
const Litter = require('../models/Litter');

async function nextPuppyLedgerNo() {
  const count = await Puppy.countDocuments();
  return `No. ${String(count + 1).padStart(3, '0')}`;
}

async function nextLitterLedgerNo() {
  const year = new Date().getFullYear();
  const count = await Litter.countDocuments({
    createdAt: { $gte: new Date(`${year}-01-01`) },
  });
  return `L-${year}-${String(count + 1).padStart(2, '0')}`;
}

module.exports = { nextPuppyLedgerNo, nextLitterLedgerNo };
