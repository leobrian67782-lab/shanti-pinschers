const express = require('express');
const router = express.Router();

const Admin = require('../models/Admin');
const Puppy = require('../models/Puppy');
const Litter = require('../models/Litter');
const Inquiry = require('../models/Inquiry');
const Testimonial = require('../models/Testimonial');
const BlogPost = require('../models/BlogPost');

const { requireAdmin } = require('../middleware/auth');
const { makeUploader, cloudinary } = require('../config/cloudinary');
const { nextPuppyLedgerNo, nextLitterLedgerNo } = require('../utils/ledger');

const uploadPuppy = makeUploader('puppies');
const uploadLitter = makeUploader('litters');
const uploadTestimonial = makeUploader('testimonials');
const uploadBlog = makeUploader('blog');

/* ---------- AUTH ---------- */

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login', error: null });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.render('admin/login', { title: 'Admin Login', error: 'Invalid email or password' });
    }
    req.session.adminId = admin._id;
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.render('admin/login', { title: 'Admin Login', error: 'Something went wrong. Try again.' });
  }
});

router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

/* ---------- DASHBOARD ---------- */

router.get('/', requireAdmin, async (req, res) => {
  const [availableCount, newInquiries, pendingTestimonials, litterCount] = await Promise.all([
    Puppy.countDocuments({ status: 'available' }),
    Inquiry.countDocuments({ status: 'new' }),
    Testimonial.countDocuments({ approved: false }),
    Litter.countDocuments({ status: { $in: ['expected', 'born', 'weaning'] } }),
  ]);
  res.render('admin/dashboard', {
    title: 'Dashboard',
    availableCount,
    newInquiries,
    pendingTestimonials,
    litterCount,
  });
});

/* ---------- PUPPIES ---------- */

router.get('/puppies', requireAdmin, async (req, res) => {
  const puppies = await Puppy.find().sort({ createdAt: -1 }).populate('litter');
  res.render('admin/puppies', { title: 'Manage Puppies', puppies });
});

router.get('/puppies/new', requireAdmin, async (req, res) => {
  const litters = await Litter.find().sort({ createdAt: -1 });
  res.render('admin/puppy-form', { title: 'Add Puppy', puppy: null, litters });
});

router.post('/puppies', requireAdmin, uploadPuppy.array('photos', 8), async (req, res) => {
  try {
    const { name, sex, color, dob, sireName, damName, litter, price, priceNote, description, status, featured } = req.body;
    const photos = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));
    const ledgerNo = await nextPuppyLedgerNo();
    await Puppy.create({
      ledgerNo,
      name,
      sex,
      color,
      dob,
      sireName,
      damName,
      litter: litter || undefined,
      price: price || undefined,
      priceNote,
      description,
      status,
      featured: featured === 'on',
      photos,
    });
    res.redirect('/admin/puppies');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error creating puppy listing: ' + err.message);
  }
});

router.get('/puppies/:id/edit', requireAdmin, async (req, res) => {
  const puppy = await Puppy.findById(req.params.id);
  const litters = await Litter.find().sort({ createdAt: -1 });
  if (!puppy) return res.redirect('/admin/puppies');
  res.render('admin/puppy-form', { title: 'Edit Puppy', puppy, litters });
});

router.put('/puppies/:id', requireAdmin, uploadPuppy.array('photos', 8), async (req, res) => {
  try {
    const { name, sex, color, dob, sireName, damName, litter, price, priceNote, description, status, featured } = req.body;
    const puppy = await Puppy.findById(req.params.id);
    if (!puppy) return res.redirect('/admin/puppies');

    const newPhotos = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));

    Object.assign(puppy, {
      name,
      sex,
      color,
      dob,
      sireName,
      damName,
      litter: litter || undefined,
      price: price || undefined,
      priceNote,
      description,
      status,
      featured: featured === 'on',
    });
    if (newPhotos.length) puppy.photos.push(...newPhotos);
    await puppy.save();
    res.redirect('/admin/puppies');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error updating puppy listing: ' + err.message);
  }
});

router.delete('/puppies/:id/photos/:photoId', requireAdmin, async (req, res) => {
  const puppy = await Puppy.findById(req.params.id);
  if (!puppy) return res.redirect('/admin/puppies');
  const photo = puppy.photos.find((p) => p._id.toString() === req.params.photoId);
  if (photo && photo.publicId) {
    await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
  }
  puppy.photos = puppy.photos.filter((p) => p._id.toString() !== req.params.photoId);
  await puppy.save();
  res.redirect(`/admin/puppies/${puppy._id}/edit`);
});

router.delete('/puppies/:id', requireAdmin, async (req, res) => {
  const puppy = await Puppy.findById(req.params.id);
  if (puppy) {
    for (const photo of puppy.photos) {
      if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
    }
    await puppy.deleteOne();
  }
  res.redirect('/admin/puppies');
});

/* ---------- LITTERS ---------- */

router.get('/litters', requireAdmin, async (req, res) => {
  const litters = await Litter.find().sort({ createdAt: -1 });
  res.render('admin/litters', { title: 'Manage Litters', litters });
});

router.get('/litters/new', requireAdmin, (req, res) => {
  res.render('admin/litter-form', { title: 'Add Litter', litter: null });
});

router.post('/litters', requireAdmin, uploadLitter.array('photos', 8), async (req, res) => {
  try {
    const { title, sireName, damName, dob, expectedDate, description, status } = req.body;
    const photos = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));
    const ledgerNo = await nextLitterLedgerNo();
    await Litter.create({ ledgerNo, title, sireName, damName, dob: dob || undefined, expectedDate: expectedDate || undefined, description, status, photos });
    res.redirect('/admin/litters');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error creating litter: ' + err.message);
  }
});

router.get('/litters/:id/edit', requireAdmin, async (req, res) => {
  const litter = await Litter.findById(req.params.id);
  if (!litter) return res.redirect('/admin/litters');
  res.render('admin/litter-form', { title: 'Edit Litter', litter });
});

router.put('/litters/:id', requireAdmin, uploadLitter.array('photos', 8), async (req, res) => {
  try {
    const { title, sireName, damName, dob, expectedDate, description, status } = req.body;
    const litter = await Litter.findById(req.params.id);
    if (!litter) return res.redirect('/admin/litters');
    const newPhotos = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));
    Object.assign(litter, { title, sireName, damName, dob: dob || undefined, expectedDate: expectedDate || undefined, description, status });
    if (newPhotos.length) litter.photos.push(...newPhotos);
    await litter.save();
    res.redirect('/admin/litters');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error updating litter: ' + err.message);
  }
});

router.delete('/litters/:id', requireAdmin, async (req, res) => {
  const litter = await Litter.findById(req.params.id);
  if (litter) {
    for (const photo of litter.photos) {
      if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
    }
    await litter.deleteOne();
  }
  res.redirect('/admin/litters');
});

/* ---------- INQUIRIES ---------- */

router.get('/inquiries', requireAdmin, async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 }).populate('puppy');
  res.render('admin/inquiries', { title: 'Inquiries', inquiries, activeFilter: req.query.status || 'all' });
});

router.put('/inquiries/:id/status', requireAdmin, async (req, res) => {
  await Inquiry.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.redirect('/admin/inquiries');
});

router.delete('/inquiries/:id', requireAdmin, async (req, res) => {
  await Inquiry.findByIdAndDelete(req.params.id);
  res.redirect('/admin/inquiries');
});

/* ---------- TESTIMONIALS ---------- */

router.get('/testimonials', requireAdmin, async (req, res) => {
  const testimonials = await Testimonial.find().sort({ createdAt: -1 });
  res.render('admin/testimonials', { title: 'Testimonials', testimonials });
});

router.get('/testimonials/new', requireAdmin, (req, res) => {
  res.render('admin/testimonial-form', { title: 'Add Testimonial' });
});

router.post('/testimonials', requireAdmin, uploadTestimonial.single('photo'), async (req, res) => {
  try {
    const { name, location, rating, message, puppyName, approved } = req.body;
    const photo = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;
    await Testimonial.create({ name, location, rating, message, puppyName, photo, approved: approved === 'on' });
    res.redirect('/admin/testimonials');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error creating testimonial: ' + err.message);
  }
});

router.put('/testimonials/:id/approve', requireAdmin, async (req, res) => {
  await Testimonial.findByIdAndUpdate(req.params.id, { approved: true });
  res.redirect('/admin/testimonials');
});

router.delete('/testimonials/:id', requireAdmin, async (req, res) => {
  const t = await Testimonial.findById(req.params.id);
  if (t && t.photo && t.photo.publicId) {
    await cloudinary.uploader.destroy(t.photo.publicId).catch(() => {});
  }
  if (t) await t.deleteOne();
  res.redirect('/admin/testimonials');
});

/* ---------- BLOG / CARE GUIDES ---------- */

router.get('/blog', requireAdmin, async (req, res) => {
  const posts = await BlogPost.find().sort({ createdAt: -1 });
  res.render('admin/blog', { title: 'Blog & Care Guides', posts });
});

router.get('/blog/new', requireAdmin, (req, res) => {
  res.render('admin/blog-form', { title: 'New Post', post: null });
});

router.post('/blog', requireAdmin, uploadBlog.single('coverImage'), async (req, res) => {
  try {
    const { title, excerpt, content, published } = req.body;
    const coverImage = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;
    await BlogPost.create({ title, excerpt, content, coverImage, published: published === 'on' });
    res.redirect('/admin/blog');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error creating post: ' + err.message);
  }
});

router.get('/blog/:id/edit', requireAdmin, async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) return res.redirect('/admin/blog');
  res.render('admin/blog-form', { title: 'Edit Post', post });
});

router.put('/blog/:id', requireAdmin, uploadBlog.single('coverImage'), async (req, res) => {
  try {
    const { title, excerpt, content, published } = req.body;
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.redirect('/admin/blog');
    if (req.file) post.coverImage = { url: req.file.path, publicId: req.file.filename };
    post.title = title;
    post.excerpt = excerpt;
    post.content = content;
    post.published = published === 'on';
    await post.save();
    res.redirect('/admin/blog');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error updating post: ' + err.message);
  }
});

router.delete('/blog/:id', requireAdmin, async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (post) {
    if (post.coverImage && post.coverImage.publicId) {
      await cloudinary.uploader.destroy(post.coverImage.publicId).catch(() => {});
    }
    await post.deleteOne();
  }
  res.redirect('/admin/blog');
});

module.exports = router;
