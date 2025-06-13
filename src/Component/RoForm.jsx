import { useState, useRef } from "react";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import Swal from "sweetalert2";
import PuffLoader from "react-spinners/PuffLoader";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";

const RoForm = () => {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [custDetails, setCustDetails] = useState({
    fname: "",
    lname: "",
    email: "",
    mob: "",
    DoComp: "",
    serpname: "",
    address: "",
    data: "",
    quantity: "",
    payment: "",
    price: "",
  });
  const [additionalFields, setAdditionalFields] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [tableData, setTableData] = useState([]);

  const handleAddDataClick = () => {
    setAdditionalFields([
      ...additionalFields,
      { data: "", quantity: "", price: "" },
    ]);
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...additionalFields];
    newFields[index][field] = value;
    setAdditionalFields(newFields);
  };

  const checkPrice = () => {
    setLoading(true);

    // Simulate a delay of 5 seconds
    setTimeout(() => {
      const quantity = parseFloat(custDetails.quantity) || 0;
      const price = parseFloat(custDetails.price) || 0;
      const totalCal = quantity * price;

      const additionalTotal = additionalFields.reduce((acc, field) => {
        const qty = parseFloat(field.quantity) || 0;
        const prc = parseFloat(field.price) || 0;
        return acc + qty * prc;
      }, 0);

      setTotalPrice(totalCal + additionalTotal);
      setTableData([
        { data: custDetails.data, quantity, price, total: totalCal },
        ...additionalFields.map((field) => ({
          ...field,
          total: parseFloat(field.quantity) * parseFloat(field.price) || 0,
        })),
      ]);
      setShowTable(true);
      setLoading(false);
    }, 2500);
  };

  const handleChange = (e) => {
    setCustDetails({ ...custDetails, [e.target.name]: e.target.value });
  };

  // Function to create the invoice PDF
  function generateInvoice() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const lineHeight = 6; // Set the line height

    const marginLeft = 14;
    // Retrieve the idCounter from localStorage
    let idCounter = localStorage.getItem("idCounter");
    // If no idCounter found, default to 0 or 1 (depending on your logic)
    idCounter = idCounter ? parseInt(idCounter, 10) : 0;

    doc.setFontSize(20);
    doc.setFont("CenturyGothic", "bold");
    doc.text(`INVOICE`, 14, 20);

    doc.setFontSize(15);
    // doc.text("logo", 14, 30);
    doc.text("Quick services", 14, 30);
    let currentY = 36; 
    //  currentY += lineHeight;
    doc.setFontSize(11);
 doc.setFont("CenturyGothic", "normal");
    // Use lineHeight for spacing
    doc.text("24a, 2nd Road, Avdhut Nagar, Hudkeshwar, Manewada", 14, currentY);
    currentY += lineHeight; // Move down by lineHeight
    doc.text("Nagpur, Maharashtra 440034", 14, currentY);
    currentY += lineHeight; // Move down by lineHeight
    doc.text("+91 95035 78709", 14, currentY);
    currentY += lineHeight; // Move down by lineHeight
    doc.text("n.kamble@quickservices.co.in", 14, currentY);
   
doc.text(`INVOICE NO:  #${idCounter}`, 140, 30);
currentY += lineHeight; // Increment Y by line height
const date = new Date();
const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
doc.text("DATE: " + formattedDate, 140, 36);
    // doc.text("CUSTOMER ID: ABC12345", 140, 60);
    // century gofficth
    
    doc.setFont("CenturyGothic");
    doc.setFontSize(11);
    doc.setTextColor("#111827");
   const custX = 14;
    let custY = 65;

doc.text("TO:", custX, custY);
custY += lineHeight; // Move down by lineHeight

const custFullName = `${custDetails.fname || ""} ${custDetails.lname || ""}`.trim() || "N/A";
doc.text(custFullName, 30, custY);
custY += lineHeight; // Move down by lineHeight
const addressLines = (custDetails.address || "N/A").split('\n');
addressLines.forEach(line => {
    doc.text(line, 30, custY);
    custY += lineHeight; // Move down by lineHeight for each line of address
});
doc.text(custDetails.mob || "N/A", 30, custY);
custY += lineHeight; // Move down by lineHeight

// Draw a line after customer details
doc.line(marginLeft, custY + 2, pageWidth - marginLeft, custY + 2); // Adjust line position based on custY

// Prepare invoice data
const defaultRows = 8; // Set the default number of rows
const invoiceData = [];

// Populate invoiceData with user-added descriptions
for (let index = 0; index < Math.max(defaultRows, tableData.length); index++) {
  if (index < tableData.length) {
    // If there is user data, add it to the table
    const item = tableData[index];
    invoiceData.push([
      index + 1,
      item.data,
      item.quantity,
      item.discount !== undefined ? item.discount : 0,
      `Rs.${parseFloat(item.price).toFixed(2)}`,
      `Rs.${parseFloat(item.total).toFixed(2)}`,
    ]);
  } else {
    // Fill remaining rows with empty values if user data is less than defaultRows
    invoiceData.push([
      index + 1,
      "", // Empty description
      "", // Empty quantity
      "", // Empty discount
      "-", // Default amount
      "-", // Default total
    ]);
  }
}

autoTable(doc, {
  head: [
    ["Sr No", "DESCRIPTION", "QUANTITY", "DISCOUNT", "AMOUNT", "TOTAL"],
  ],
  body: invoiceData,
  headStyles: {
    halign: 'right', // Align header text to right
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    fontStyle: 'bold',
  },
  startY: custY + 10,
  theme: "grid",
  columnStyles: {
    0:{halign:'center'},
    1: { halign: 'left' },
    2: { halign: 'right' }, // QUANTITY column (index 2)
    3: { halign: 'right' }, // DISCOUNT column (index 3)
    4: { halign: 'right' }, // AMOUNT column (index 4)
    5: { halign: 'right' }, // TOTAL column (index 5)
  },
  styles: {
    lineWidth: 0, // Set the line width for borders
    lineColor: [0, 0, 0], // Set the line color for borders (black)
    cellPadding: 2, // Optional: Add padding to cells
    fillColor: [255, 255, 255], // Default fill color for cells
  
  },
  didParseCell: function (data) {
    // Draw line below header
    if (data.row.index === 0) {
      // const headerY = data.cell.y + data.cell.height; // Position right below the header
      // doc.line(marginLeft, headerY, pageWidth - marginLeft, headerY); // Line below header
      data.cell.styles.fillColor = [255, 255, 255]; // White color for header
      data.cell.styles.textColor = [0, 0, 0]; // Black text color for header
    }

    // Apply zebra stripes to all body rows
    if (data.row.index > 0 && data.row.index < invoiceData.length + 1) { // Exclude header and footer
      if (data.cell.raw === "") { // Check if it's the Sr No cell
        data.cell.raw = data.row.index; // Set Sr No based on the row index
      }

      // Apply zebra striping
      if ((data.row.index - 1) % 2 === 0) { // Adjusted to start from 0 for zebra striping
         data.cell.styles.fillColor = [217, 223, 225]; // Light gray color for odds rows
      } else {
        data.cell.styles.fillColor = [255, 255, 255]; // White color for even rows
       
      }
    } else if (data.row.index === invoiceData.length + 1) {
      const footerY = data.cell.y; // Position right above the footer
      doc.line(marginLeft, footerY, pageWidth - marginLeft, footerY); // Line above footer
      data.cell.styles.fillColor = [255, 255, 255]; // White color for footer
      data.cell.styles.textColor = [0, 0, 0]; // Black text color for footer
      data.cell.styles.fontStyle = 'bold'; // Bold text for footer
    }
  },
  foot: [
    [
      { content: "", styles: {} },
      { content: "", styles: {} },
      { content: "", styles: {} },
      { content: "", styles: {} },
      { content: "TOTAL DUE :", styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], 
   } },
      {
        content: `Rs.${totalPrice.toFixed(2)}`,
        styles: { halign: "right", fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      },
    ],
  ],
  
});



    doc.setFontSize(11);
  
    // const lineY = 100;
    doc.setDrawColor(0); // black color for the line
    doc.setLineWidth(0.4); // subtle thin line
    doc.line(marginLeft, 280, pageWidth - marginLeft, 280);
    doc.setFont("CenturyGothic", "italic");
    doc.text("For more details visit at : quickservices.co.in", 66, 260);
    doc.setFont("CenturyGothic", "normal");
     doc.setFontSize(14);
    doc.text("THANK YOU FOR YOUR BUSINESS !", 60, 270);
    // Saving the PDF
    doc.save(`invoice ${idCounter}.pdf`);
  }

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission

    // Check if the form is valid
    if (!formRef.current.checkValidity()) {
      event.stopPropagation(); // Stop the form from submitting
      formRef.current.classList.add("was-validated"); // Add Bootstrap validation class
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to submit the form?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4FBFAB",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Submit!",
    }).then((result) => {
      if (result.isConfirmed) {
        // Generate the invoice PDF
        console.log("Generating invoice...");
        generateInvoice();

        // Get existing idCounter from localStorage or start at 0
        let idCounter = localStorage.getItem("idCounter");
        idCounter = idCounter ? parseInt(idCounter, 10) : 0;

        // Increment for this submission
        idCounter += 1;

        // Save back to localStorage
        localStorage.setItem("idCounter", idCounter);

        // Add the unique ID to the form data
        const formData = new FormData(event.target);
        formData.append("uniqueId", idCounter); // Append the unique ID

        fetch(event.target.action, {
          method: "POST",
          body: formData,
        }).then((response) => {
          if (response.ok) {
            Swal.fire({
              title: "Submitted!",
              text:
                "Your form has been submitted successfully. Your unique ID is: " +
                idCounter,
              icon: "success",
            }).then(() => {
              setCustDetails({
                fname: "",
                lname: "",
                email: "",
                mob: "",
                DoComp: "",
                serpname: "",
                address: "",
                data: "",
                quantity: "",
                payment: "",
                price: "",
              });
              formRef.current.reset();
              window.location.href = "/";
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: "There was an error submitting the form.",
              icon: "error",
            });
          }
        });
      }
    });
  };

  return (
    <>
      <section className="ro_form">
        <div style={{ backgroundColor: " #0b6453" }}>
          <h1 className="text-center py-3 text-white">Quick Services</h1>
          <h5 className="pb-3 text-center text-white">Customer Service Form</h5>
        </div>
        <div className="container" role="main">
          <form
            ref={formRef}
            aria-label="Quick services form"
            onSubmit={handleSubmit}
            className="needs-validation"
            noValidate
            action="https://script.google.com/macros/s/AKfycbzR-lOOEg7_-ZbOdTXxoiOwYVBrFU86x_64q7ztl2L93Gsi0CGpSJi-E4BBnkPYR6gJ/exec"
            method="post"
          >
            <div className="row mt-3">
              {/* First Name */}
              <div className="col-12 col-md-6 mb-3">
                <label htmlFor="fname" className="form-label">
                  First Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="fname"
                  placeholder="Enter First Name"
                  name="fname"
                  value={custDetails.fname}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
                <div className="invalid-feedback">Please write first Name.</div>
              </div>

              {/* Last Name */}
              <div className="col-12  col-md-6 mb-3">
                <label htmlFor="lname" className="form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="lname"
                  placeholder="Enter Last Name"
                  name="lname"
                  value={custDetails.lname}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />

                <div className="invalid-feedback">Please write last name.</div>
              </div>

              {/* Email Address */}
              <div className="col-12 col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  placeholder="Enter Email Address"
                  value={custDetails.email}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
                <div className="invalid-feedback">Please write email.</div>
              </div>

              {/* Mobile Number */}
              <div className="col-12 col-md-6 mb-3">
                <label htmlFor="mob" className="form-label">
                  Mobile No
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="mob"
                  placeholder="Enter Customer Mobile No"
                  name="mob"
                  value={custDetails.mob}
                  onChange={handleChange}
                  pattern="^\+?\d{10,15}$"
                  title="Enter a valid phone number"
                  required
                  aria-required="true"
                />
                <div className="invalid-feedback">
                  Please write Mobile number.
                </div>
              </div>

              {/* Date of Completion */}
              {/* <div className="mb-3 col-12 col-md-4">
                <label htmlFor="DoComp" className="form-label">
                  Date of Completion
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="DoComp"
                  name="DoComp"
                  value={custDetails.DoComp}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
                <div className="invalid-feedback">
                  Please write Date of Completion
                </div>
              </div> */}

              {/* Payment Mode */}
              <div className="col-12 col-md-6 mb-3">
                <label htmlFor="payment" className="form-label">
                  Mode of Payment
                </label>
                <select
                  className="form-select"
                  id="payment"
                  name="payment"
                  value={custDetails.payment}
                  onChange={handleChange}
                  required
                  aria-required="true"
                >
                  <option value="">Open this select menu</option>
                  <option value="Cash">Cash on Delivery</option>
                  <option value="UPI">UPI</option>
                </select>

                <div className="invalid-feedback">
                  Please write Payment Mode.
                </div>
              </div>

              {/* Service Person Name */}
              <div className="col-12 col-md-6 mb-3">
                <label htmlFor="serpname" className="form-label">
                  Service Person Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="serpname"
                  placeholder="Enter your Name"
                  name="serpname"
                  value={custDetails.serpname}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
                <div className="invalid-feedback">
                  Please Service person Name.
                </div>
              </div>

              {/* Address */}
              <div className="mb-3 col-12">
                <label htmlFor="address" className="form-label">
                  Address
                </label>
                <textarea
                  className="form-control"
                  id="address"
                  rows="3"
                  name="address"
                  value={custDetails.address}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  placeholder="Enter address"
                ></textarea>
                <div className="invalid-feedback">
                  Please write customer address.
                </div>
              </div>

              {/* Select Data */}
              <div className="col-12 col-md-4 mb-3">
                <label htmlFor="data" className="form-label">
                  Description
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="data"
                  name="data"
                  value={custDetails.data}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
                <div className="invalid-feedback">
                  Please add which kind of data.
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-3 col-6 col-md-4">
                <label htmlFor="quantity" className="form-label">
                  No. of Quantity
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="quantity"
                  name="quantity"
                  value={custDetails.quantity}
                  onChange={handleChange}
                  min="0"
                  required
                  aria-required="true"
                  inputMode="numeric"
                />
                <div className="invalid-feedback">
                  Please add number of quantity.
                </div>
              </div>

              {/* Price */}
              <div className="mb-3 col-6 col-md-4">
                <label htmlFor="price" className="form-label">
                  Price
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="price"
                  name="price"
                  value={custDetails.price}
                  onChange={handleChange}
                  min="0"
                  required
                  aria-required="true"
                  inputMode="decimal"
                  step="0.01"
                />
                <div className="invalid-feedback">
                  Please add price of data.
                </div>
              </div>

              {additionalFields.map((field, index) => (
                <div
                  key={index}
                  className="row mb-3 pe-0 me-0 "
                  role="group"
                  aria-labelledby={`additional-label-${index}`}
                >
                  <div className="col-12 col-md-4">
                    <label
                      htmlFor={`data-${index}`}
                      className="form-label"
                      id={`additional-label-${index}`}
                    >
                      Description
                    </label>
                    <input
                      type="text"
                      className="form-control pe-0"
                      id={`data-${index}`}
                      value={field.data}
                      onChange={(e) =>
                        handleFieldChange(index, "data", e.target.value)
                      }
                      required
                      aria-required="true"
                    />
                    <div className="invalid-feedback">Please add Data.</div>
                  </div>

                  <div className="col-6 col-md-4">
                    <label htmlFor={`quantity-${index}`} className="form-label">
                      No. of Quantity
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id={`quantity-${index}`}
                      value={field.quantity}
                      onChange={(e) =>
                        handleFieldChange(index, "quantity", e.target.value)
                      }
                      min="0"
                      required
                      aria-required="true"
                      inputMode="numeric"
                    />
                    <div className="invalid-feedback">
                      Please add a Quantity.
                    </div>
                  </div>

                  <div className="col-6 col-md-4">
                    <label htmlFor={`price-${index}`} className="form-label">
                      Price
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id={`price-${index}`}
                      value={field.price}
                      onChange={(e) =>
                        handleFieldChange(index, "price", e.target.value)
                      }
                      min="0"
                      required
                      aria-required="true"
                      inputMode="decimal"
                      step="0.01"
                    />
                    <div className="invalid-feedback">Please add a price.</div>
                  </div>
                </div>
              ))}

              {/* Additional Fields */}

              <div className="col-12 col-md-6 d-flex align-items-center mb-3">
                <p className="mb-0 me-5">Do you want to add more data?</p>

                <Fab
                  color="success"
                  aria-label="add"
                  onClick={handleAddDataClick}
                  style={{ width: "45px", height: "45px" }}
                >
                  <AddIcon />
                </Fab>
              </div>

              <div className="d-flex justify-content-center mb-3">
                <button
                  type="button"
                  onClick={checkPrice}
                  className="btn btn-primary"
                  aria-label="Calculate total price"
                >
                  Check Price
                </button>
              </div>
              <div className="d-flex justify-content-center">
                <PuffLoader loading={loading} size={50} />
              </div>
            </div>

            {/* Table to display the data */}
            {showTable && (
              <section
                className="mt-4 table-responsive"
                aria-label="Price summary table"
              >
                <h2>Price Summary :</h2>
                <table className="table" role="table">
                  <thead>
                    <tr>
                      <th scope="col">Description</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Discount</th>
                      <th scope="col">Price</th>
                      <th scope="col">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.data}</td>
                        <td>{item.quantity}</td>
                        <td>
                          {item.discount !== undefined ? item.discount : 0}
                        </td>
                        <td>{(parseFloat(item.price) || 0).toFixed(2)}</td>
                        <td>{(parseFloat(item.total) || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h4>Total Price: &#8377; {totalPrice.toFixed(2)}</h4>
              </section>
            )}

            <div className="d-flex justify-content-center">
              <button
                type="submit"
                className="btn btn-primary mb-5 my-3"
                aria-label="Submit form"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default RoForm;