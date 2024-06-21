const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');






const app = express();
const PORT = process.env.PORT || 5000;



// MongoDB Connection
mongoose.connect('mongodb+srv://abcd:abcd@cluster0.slbdray.mongodb.net/Khatadb?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



app.use(bodyParser.json());

// Define MongoDB Schemas and Models
const profileSchema = new mongoose.Schema({
  phoneNumber: String,
  accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
});

const accountSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  customers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
  suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
});
const amountSchema = new mongoose.Schema({
  amount: String,
  comand: Number,
  time: Date,
  itemName: String,
  quantity: Number,
  image: String
           

 
  
});

const customerSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,
  commandTime: String,
  amount: [amountSchema],
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
});

const supplierSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,
  commandTime: String,
  amount: [amountSchema],
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
});

const Profile = mongoose.model('Profile', profileSchema);
const Account = mongoose.model('Account', accountSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);



app.use(bodyParser.json());


// Create Profile
app.post('/api/profiles', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const existingProfile = await Profile.findOne({ phoneNumber });

    if (existingProfile) {
      // If profile exists, return its information
      return res.status(200).json({
        message: 'Profile already exists',
        profileId: existingProfile._id,
      });
    }

    // Check if the maximum number of profiles has been reached (limit: 8)
    const totalProfiles = await Profile.countDocuments();
    
    if (totalProfiles >= 8) {
      return res.status(403).json({ message: 'Maximum allowed profiles reached' });
    }



    // If profile doesn't exist and the limit is not reached, create a new one
    const newProfile = await Profile.create({ phoneNumber });

    res.status(201).json({
      message: 'Profile created successfully!',
      profileId: newProfile._id,
    });
  } catch (error) {
    console.error('Error creating or fetching profile:', error);
    res.status(500).json({ message: 'Error creating or fetching profile' });
  }
});


// Create Account
app.post('/api/accounts', async (req, res) => {
  try {
    const { name, phoneNumber, profileId } = req.body;
    const account = await Account.create({ name, phoneNumber, profileId });
    // Update the Profile with the new Account reference
    await Profile.findByIdAndUpdate(profileId, { $push: { accounts: account._id } });
    res.status(201).json({ message: 'Account created successfully!', accountId: account._id });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Error creating account' });
  }
});

// Create Customer
app.post('/api/customerss', async (req, res) => {
  try {
    const { name, phoneNumber, commandTime, accountId, amount } = req.body;
    const customer = await Customer.create({ name, phoneNumber, commandTime, accountId, amount });
    // Update the Account with the new Supplier reference
    await Account.findByIdAndUpdate(accountId, { $push: { customers: customer._id } });
    res.status(201).json({ message: 'Customer created successfully!', customerId: customer._id });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error creating customer' });
  }
});


app.post('/api/customers/:customerId/add-amount', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { amount, comand, time, itemName, quantity, image } = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Add the new amount to the customer's amount array
    customer.amount.push({ amount, comand, time, itemName, quantity, image });
    await customer.save();

    res.status(201).json({ message: 'Amount added successfully!', customerId: customer._id });
  } catch (error) {
    console.error('Error adding amount to customer:', error);
    res.status(500).json({ message: 'Error adding amount to customer' });
  }
});


// Edit Amount for a Customer
app.put('/api/customers/:customerId/edit-amount/:amountId', async (req, res) => {
  try {
    const { customerId, amountId } = req.params;
    const { amount, comand, time, itemName, quantity } = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Find the amount to be edited
    const editedAmount = customer.amount.id(amountId);

    if (!editedAmount) {
      return res.status(404).json({ message: 'Amount not found' });
    }

    // Update the amount details
    editedAmount.amount = amount;
    editedAmount.comand = comand;
    editedAmount.time = time;
    editedAmount.itemName = itemName;
    editedAmount.quantity = quantity;

    await customer.save();

    res.status(200).json({ message: 'Amount edited successfully!', customerId: customer._id });
  } catch (error) {
    console.error('Error editing amount for customer:', error);
    res.status(500).json({ message: 'Error editing amount for customer' });
  }
});

app.delete('/api/customers/:customerId/delete-amount/:amountId', async (req, res) => {
  try {
    const { customerId, amountId } = req.params;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { $pull: { amount: { _id: amountId } } },
      { new: true }
    );

    if (!updatedCustomer) {
      console.log('Customer not found');
      return res.status(404).json({ message: 'Customer not found' });
    }

    console.log('Amount deleted successfully');
    res.status(200).json({ message: 'Amount deleted successfully!', customerId: updatedCustomer._id });
  } catch (error) {
    console.error('Error deleting amount for customer:', error);
    res.status(500).json({ message: 'Error deleting amount for customer' });
  }
});




app.post('/api/suppliers/:supplierId/add-amount', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { amount, comand, time, itemName, quantity, image } = req.body;

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Add the new amount to the customer's amount array
    supplier.amount.push({ amount, comand, time, itemName, quantity, image });
    await supplier.save();

    res.status(201).json({ message: 'Amount added successfully!', supplierId: supplier._id });
  } catch (error) {
    console.error('Error adding amount to supplier:', error);
    res.status(500).json({ message: 'Error adding amount to supplier' });
  }
});

// Edit Amount for a Customer
app.put('/api/suppliers/:supplierId/edit-amount/:amountId', async (req, res) => {
  try {
    const { supplierId, amountId } = req.params;
    const { amount, comand, time, itemName, quantity } = req.body;

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Find the amount to be edited
    const editedAmount = supplier.amount.id(amountId);

    if (!editedAmount) {
      return res.status(404).json({ message: 'Amount not found' });
    }

    // Update the amount details
    editedAmount.amount = amount;
    editedAmount.comand = comand;
    editedAmount.time = time;
    editedAmount.itemName = itemName;
    editedAmount.quantity = quantity;

    await supplier.save();

    res.status(200).json({ message: 'Amount edited successfully!', supplierId: supplier._id });
  } catch (error) {
    console.error('Error editing amount for supplier:', error);
    res.status(500).json({ message: 'Error editing amount for supplier' });
  }
});

app.delete('/api/suppliers/:supplierId/delete-amount/:amountId', async (req, res) => {
  try {
    const { supplierId, amountId } = req.params;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      supplierId,
      { $pull: { amount: { _id: amountId } } },
      { new: true }
    );

    if (!updatedSupplier) {
      console.log('Supplier not found');
      return res.status(404).json({ message: 'Supplier not found' });
    }

    console.log('Amount deleted successfully');
    res.status(200).json({ message: 'Amount deleted successfully!', supplierId: updatedSupplier._id });
  } catch (error) {
    console.error('Error deleting amount for supplier:', error);
    res.status(500).json({ message: 'Error deleting amount for supplier' });
  }
});



// Create Supplier
app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, phoneNumber, commandTime, accountId, amount, } = req.body;
    const supplier = await Supplier.create({ name, phoneNumber, commandTime, accountId, amount });
    // Update the Account with the new Supplier reference
    await Account.findByIdAndUpdate(accountId, { $push: { suppliers: supplier._id } });
    res.status(201).json({ message: 'Supplier created successfully!', supplierId: supplier._id });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Error creating supplier' });
  }
});

// Get All Profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('accounts');
    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: 'Error fetching profiles' });
  }
});

// Get Profile by ID
app.get('/api/profiles/:profileId', async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await Profile.findById(profileId).populate('accounts');
      
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
  
      res.status(200).json(profile);
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      res.status(500).json({ message: 'Error fetching profile by ID' });
    }
  });
  

// Get All Accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await Account.find().populate('customers suppliers');
    res.status(200).json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Error fetching accounts' });
  }
});

// Get Accounts by Profile ID
app.get('/api/accounts/by-profile/:profileId', async (req, res) => {
    try {
      const { profileId } = req.params;
      const accounts = await Account.find({ profileId }).populate('customers suppliers');
      res.status(200).json(accounts);
    } catch (error) {
      console.error('Error fetching accounts by profile ID:', error);
      res.status(500).json({ message: 'Error fetching accounts by profile ID' });
    }
  });

// Get Customer by ID
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({ message: 'Error fetching customer by ID' });
  }
});

app.delete('/api/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const deletedCustomer = await Customer.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      console.log('Customer not found');
      return res.status(404).json({ message: 'Customer not found' });
    }

    console.log('Customer deleted successfully');
    res.status(200).json({ message: 'Customer deleted successfully!', customerId: deletedCustomer._id });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer' });
  }
});


// Get Customers by Account ID
app.get('/api/customers/by-account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const customers = await Customer.find({ accountId });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers by account ID:', error);
    res.status(500).json({ message: 'Error fetching customers by account ID' });
  }
});

// Get Suppliers by Account ID
app.get('/api/suppliers/by-account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const suppliers = await Supplier.find({ accountId });
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers by account ID:', error);
    res.status(500).json({ message: 'Error fetching suppliers by account ID' });
  }
});


// Get Supplier by ID
app.get('/api/suppliers/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    console.error('Error fetching supplier by ID:', error);
    res.status(500).json({ message: 'Error fetching supplier by ID' });
  }
});


  

// Get All Customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

// Get All Suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Error fetching suppliers' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});