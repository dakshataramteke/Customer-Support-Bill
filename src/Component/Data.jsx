import { useState, useRef } from "react";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import Swal from "sweetalert2";
import PuffLoader from "react-spinners/PuffLoader";
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

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

    // Simulate a delay for calculation
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
          total:
            (parseFloat(field.quantity) * parseFloat(field.price)) || 0,
        })),
      ]);
      setShowTable(true);
      setLoading(false);
    }, 2500);
  };

  const handleChange = (e) => {
    setCustDetails({ ...custDetails, [e.target.name]: e.target.value });
  };

  // Generate PDF and return blob (for whatsappData)
  const generatePdfBlob = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const lineHeight = 8;
    let idCounter = localStorage.getItem("idCounter");
    idCounter = idCounter ? parseInt(idCounter, 10) : 0;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`INVOICE`, 14, 20);

    doc.setFontSize(16);
    doc.text("Quick services", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text("24a, 2nd Road, Avdhut Nagar, Hudkeshwar, Manewada", 14, 50);
    doc.text("Nagpur, Maharashtra 440034", 14, 60);
    doc.text("+91 95035 78709", 14, 70);
    doc.text("email", 14, 80);

    doc.text(`INVOICE NO.:  #${idCounter}`, 140, 40);
    const date = new Date();
    const formattedDate = `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    doc.text("DATE: " + formattedDate, 140, 50);

    const custX = 14;
    let custY = 100;
    doc.setFont("helvetica");
    doc.setFontSize(13);
    doc.setTextColor("#111827");
    doc.text("TO:", custX, custY);
    custY += lineHeight;

    const custFullName = `${custDetails.fname || ""} ${
      custDetails.lname || ""
    }`.trim();
    doc.text(custFullName || "N/A", custX, custY);
    custY += lineHeight;
    doc.text(custDetails.address || "N/A", custX, custY);
    custY += lineHeight;
    doc.text(custDetails.mob || "N/A", custX, custY);

    doc.text(`Payment Mode:  ${custDetails.payment || "N/A"}`, 14, 140);

    // Prepare table data
    const invoiceData = tableData.map((item, index) => [
      index + 1,
      item.data,
      item.quantity,
      item.discount !== undefined ? item.discount : 0,
      `Rs.${parseFloat(item.price).toFixed(2)}`,
      `Rs.${parseFloat(item.total).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [
        [
          "Sr No",
          "DESCRIPTION",
          "QUANTITY",
          "DISCOUNT",
          "AMOUNT",
          "TOTAL",
        ],
      ],
      body: invoiceData,
      startY: 150,
      theme: "grid",
      foot: [
        [
          { content: "TOTAL" },
          { content: "" },
          { content: "" },
          { content: "" },
          { content: "" },
          {
            content: `Rs.${totalPrice.toFixed(2)}`,
            styles: { halign: "left", fontStyle: "bold" },
          },
        ],
      ],
    });

    const finalY =
      doc.autoTable && doc.autoTable.previous
        ? doc.autoTable.previous.finalY
        : 150;

    doc.setFontSize(13);
    const text = "THANK YOU !";
    const textWidth = doc.getTextWidth(text);
    const centerX = (pageWidth - textWidth) / 2;
    doc.text(text, centerX, finalY + 110);
    const marginLeft = 14;

    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.line(marginLeft, 280, pageWidth - marginLeft, 280);
    doc.text("for more info visit,", 14, 290);
    doc.text("www.quickservices.co.in", 60, 290);

    return doc.output("blob");
  };

  // Function to download Blob file
  const downloadBlob = (blob, filename) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    // Cleanup
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  // whatsappData: generate PDF, download, open WhatsApp with message
  const whatsappData = () => {
    if (!custDetails.mob) {
      Swal.fire({
        title: "Mobile Number Missing",
        text: "Please enter a valid mobile number to send the invoice on WhatsApp.",
        icon: "warning",
      });
      return;
    }

    // Clean mobile number to digits only and prepend country code if missing
    let mobileNumber = custDetails.mob.replace(/\D/g, "");
    if (mobileNumber.length === 10) {
      // Assume Indian number, prepend country code +91
      mobileNumber = "91" + mobileNumber;
    }

    setLoading(true);

    // Generate PDF blob
    const pdfBlob = generatePdfBlob();

    // Filename with invoice number for clarity
    let idCounter = localStorage.getItem("idCounter");
    idCounter = idCounter ? parseInt(idCounter, 10) : 0;
    const filename = `invoice_${idCounter}.pdf`;

    // Download PDF for user to share
    downloadBlob(pdfBlob, filename);

    setLoading(false);

    // Create WhatsApp message text
    const message = `Hello, your invoice (Ref #: ${idCounter}) is ready. Please find the downloaded PDF file and share it here. Thank you!`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    // WhatsApp API link with mobile number and message
    const whatsappApiUrl = `https://wa.me/${mobileNumber}?text=${encodedMessage}`;

    // Open WhatsApp link in new tab/window
    window.open(whatsappApiUrl, "_blank");
  };

  const generateInvoice = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const lineHeight = 8;
    let idCounter = localStorage.getItem("idCounter");
    idCounter = idCounter ? parseInt(idCounter, 10) : 0;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`INVOICE`, 14, 20);

    doc.setFontSize(16);
    doc.text("Quick services", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text("24a, 2nd Road, Avdhut Nagar, Hudkeshwar, Manewada", 14, 50);
    doc.text("Nagpur, Maharashtra 440034", 14, 60);
    doc.text("+91 95035 78709", 14, 70);
    doc.text("email", 14, 80);

    doc.text(`INVOICE NO.:  #${idCounter}`, 140, 40);
    const date = new Date();
    const formattedDate = `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    doc.text("DATE: " + formattedDate, 140, 50);

    const custX = 14;
    let custY = 100;
    doc.setFont("helvetica");
    doc.setFontSize(13);
    doc.setTextColor("#111827");
    doc.text("TO:", custX, custY);
    custY += lineHeight;

    const custFullName = `${custDetails.fname || ""} ${
      custDetails.lname || ""
    }`.trim();
    doc.text(custFullName || "N/A", custX, custY);
    custY += lineHeight;
    doc.text(custDetails.address || "N/A", custX, custY);
    custY += lineHeight;
    doc.text(custDetails.mob || "N/A", custX, custY);

    doc.text(`Payment Mode:  ${custDetails.payment || "N/A"}`, 14, 140);

    // Prepare table data
    const invoiceData = tableData.map((item, index) => [
      index + 1,
      item.data,
      item.quantity,
      item.discount !== undefined ? item.discount : 0,
      `Rs.${parseFloat(item.price).toFixed(2)}`,
      `Rs.${parseFloat(item.total).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [
        [
          "Sr No",
          "DESCRIPTION",
          "QUANTITY",
          "DISCOUNT",
          "AMOUNT",
          "TOTAL",
        ],
      ],
      body: invoiceData,
      startY: 150,
      theme: "grid",
      foot: [
        [
          { content: "TOTAL" },
          { content: "" },
          { content: "" },
          { content: "" },
          { content: "" },
          {
            content: `Rs.${totalPrice.toFixed(2)}`,
            styles: { halign: "left", fontStyle: "bold" },
          },
        ],
      ],
    });

    const finalY =
      doc.autoTable && doc.autoTable.previous
        ? doc.autoTable.previous.finalY
        : 150;

    doc.setFontSize(13);
    const text = "THANK YOU !";
    const textWidth = doc.getTextWidth(text);
    const centerX = (pageWidth - textWidth) / 2;
    doc.text(text, centerX, finalY + 110);
    const marginLeft = 14;

    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.line(marginLeft, 280, pageWidth - marginLeft, 280);
    doc.text("for more info visit,", 14, 290);
    doc.text("www.quickservices.co.in", 60, 290);

    // Save PDF file locally
    doc.save(`invoice_${idCounter}.pdf`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formRef.current.checkValidity()) {
      event.stopPropagation();
      formRef.current.classList.add("was-validated");
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
        generateInvoice();

        let idCounter = localStorage.getItem("idCounter");
        idCounter = idCounter ? parseInt(idCounter, 10) : 0;
        idCounter += 1;
        localStorage.setItem("idCounter", idCounter);

        const formData = new FormData(event.target);
        formData.append("uniqueId", idCounter);

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
              // Trigger WhatsApp sharing and download
              whatsappData();

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
          <h5 className="pb-3 text-center text-white">
            Customer Service Form
          </h5>
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
              <div className="col-12 col-md-6 mb-3">
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
                <div className="invalid-feedback">Please write Mobile number.</div>
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
                <div className="invalid-feedback">Please add which kind of data.</div>
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
                <div className="invalid-feedback">Please add number of quantity.</div>
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
                <div className="invalid-feedback">Please add price of data.</div>
              </div>

              {additionalFields.map((field, index) => (
                <div
                  key={index}
                  className="row mb-3 pe-0 me-0"
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
                    <div className="invalid-feedback">Please add a Quantity.</div>
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
                        <td>{item.discount !== undefined ? item.discount : 0}</td>
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