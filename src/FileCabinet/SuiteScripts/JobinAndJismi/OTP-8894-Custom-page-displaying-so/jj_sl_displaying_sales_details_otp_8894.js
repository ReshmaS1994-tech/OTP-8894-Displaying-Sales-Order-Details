/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * /***************************************************************************************************************************************
* Client Name
*
*
*
${OTP-8894}:{Custom page for display sales order based on the status}
*
*
*******************************************************************************************************************************************
*
*Author:Jobin and Jismi IT Services
*
*Date Created:06-june-2025
*
*Description: implementation of a custom form using a Suitelet script in NetSuite to display sales orders requiring fulfillment or billing.
The form includes a sublist with key details such as Internal IDs, Document Name, Date, Status, Customer Name, Subsidiary, Department, Class,
Subtotal, Tax, and Total. Additionally, dynamic filters for Status, Customer, Subsidiary, and Department were integrated to ensure
 real-time updates based on user selections.
 
*
*REVISION HISTORY
*@version 1.0 04-June-2025 :Created the initial build by JJ0402
********************************************************************************************************************************************
*/

define(['N/log', 'N/search', 'N/ui/serverWidget'], (log, search, serverWidget) => {
  const onRequest = (scriptContext) => {
    if (scriptContext.request.method === "GET") {
      try {
        const form = createForm(serverWidget);
        const subList = createSublist(form, serverWidget);
        const params = scriptContext.request.parameters;

        setDefaultValues(form, params);
        const filters = buildSearchFilters(params);
        runSalesSearch(filters, subList);

        form.addSubmitButton({ label: "Submit" });
        form.addButton({ id: "custpage_reset", label: "Reset", functionName: "onResetFilters" });

        scriptContext.response.writePage(form);
      } catch (error) {
        log.error("Error in Suitelet", error);
      }
    }
  };

  /**
 * Creates and returns a NetSuite UI form with predefined filter fields.
 *
 * The form includes:
 * - A STATUS dropdown with specific sales order statuses
 * - CUSTOMER, SUBSIDIARY, and DEPARTMENT select fields sourced from corresponding records
 * - A reference to a client script file
 *
 * @param {ServerWidget} serverWidget - The NetSuite serverWidget module used to create form and fields.
 * @returns {Form} The configured NetSuite Suitelet form object.
 */

  function createForm(serverWidget) {
    const form = serverWidget.createForm({ title: "Sales Order" });
    form.clientScriptFileId = 2512;

    const statusField = form.addField({ id: "cust_status", label: "STATUS", type: serverWidget.FieldType.SELECT });
    statusField.addSelectOption({ value: "", text: "" });
    statusField.addSelectOption({ value: "SalesOrd:B", text: "Pending Fulfillment" });
    statusField.addSelectOption({ value: "SalesOrd:D", text: "Partially Fulfilled" });
    statusField.addSelectOption({ value: "SalesOrd:E", text: "Pending Billing/Partially Fulfilled" });
    statusField.addSelectOption({ value: "SalesOrd:F", text: "Pending Billing" });

    form.addField({ id: "cust_customer", label: "CUSTOMER", type: serverWidget.FieldType.SELECT, source: "customer" });
    form.addField({ id: "cust_subsidiary", label: "SUBSIDIARY", type: serverWidget.FieldType.SELECT, source: "subsidiary" });
    form.addField({ id: "cust_department", label: "DEPARTMENT", type: serverWidget.FieldType.SELECT, source: "department" });

    return form;
  }

  /**
 * Sets default values for filter fields on the form using parameters from the request.
 *
 * This function updates the default selected values for the following fields:
 * - STATUS (cust_status)
 * - CUSTOMER (cust_customer)
 * - SUBSIDIARY (cust_subsidiary)
 * - DEPARTMENT (cust_department)
 *
 * @param {Form} form - The Suitelet form object where the default values will be applied.
 * @param {Object} params - The request parameters object containing the selected filter values.
 * @param {string} [params.cust_status] - The selected status value.
 * @param {string} [params.customer_name] - The selected customer internal ID.
 * @param {string} [params.cust_subsidiary] - The selected subsidiary ID.
 * @param {string} [params.cust_department] - The selected department ID.
 */

  function setDefaultValues(form, params) {
    form.getField({ id: "cust_status" }).defaultValue = params.cust_status || "";
    form.getField({ id: "cust_customer" }).defaultValue = params.customer_name || "";
    form.getField({ id: "cust_subsidiary" }).defaultValue = params.cust_subsidiary || "";
    form.getField({ id: "cust_department" }).defaultValue = params.cust_department || "";
  }

  /**
 * Constructs an array of search filters to be applied to a NetSuite sales order search.
 *
 * The function begins with a base set of filters to exclude:
 * - Mainline entries
 * - Shipping lines
 * - Cost of goods sold lines
 * - Discount items
 * - Tax lines
 *
 * Then it adds dynamic filters based on the presence of optional parameters:
 * - Customer (customer_name)
 * - Subsidiary (cust_subsidiary)
 * - Department (cust_department)
 * - Status (cust_status)
 *
 * @param {Object} params - The request parameters containing optional filter values.
 * @param {string} [params.customer_name] - Internal ID of the selected customer.
 * @param {string} [params.cust_subsidiary] - Internal ID of the selected subsidiary.
 * @param {string} [params.cust_department] - Internal ID of the selected department.
 * @param {string} [params.cust_status] - Code of the selected sales order status.
 * @returns {Array} filters - The complete array of filters to be used in a NetSuite search.
 */

  function buildSearchFilters(params) {
    const filters = [
      ["mainline", "is", "F"], "AND",
      ["shipping", "is", "F"], "AND",
      ["cogs", "is", "F"], "AND",
      ["item.type", "noneof", "Discount"], "AND",
      ["taxline", "is", "F"]
    ];

    if (params.customer_name && params.customer_name.trim() !== "") {
      filters.push("AND", ["entity", "anyof", params.customer_name]);
    }
    if (params.cust_subsidiary && params.cust_subsidiary.trim() !== "") {
      filters.push("AND", ["subsidiary", "is", params.cust_subsidiary]);
    }
    if (params.cust_department && params.cust_department.trim() !== "") {
      filters.push("AND", ["department", "is", params.cust_department]);
    }
    if (params.cust_status && params.cust_status.trim() !== "") {
      filters.push("AND", ["status", "is", params.cust_status]);
    }

    return filters;
  }

  /**
 * Adds a custom sublist to the Suitelet form for displaying sales order details.
 *
 * The sublist includes the following fields:
 * - INTERNAL ID (Integer)
 * - DOCUMENT NAME (Text)
 * - DATE (Date)
 * - STATUS (Text)
 * - CUSTOMER NAME (Text)
 * - SUBSIDIARY (Text)
 * - CLASS (Text)
 * - DEPARTMENT (Text)
 * - SUBTOTAL (Text)
 * - TAX (Text)
 * - TOTAL (Currency)
 *
 * @param {Form} form - The Suitelet form to which the sublist is added.
 * @param {ServerWidget} serverWidget - The NetSuite serverWidget module used for field types.
 * @returns {Sublist} subList - The configured sublist object ready for population.
 */

  function createSublist(form, serverWidget) {
    const subList = form.addSublist({
      id: "sales_sublist",
      label: "Sales Details",
      type: serverWidget.SublistType.LIST
    });

    const fields = [
      ["internal_id", "INTERNAL ID", serverWidget.FieldType.INTEGER],
      ["document_number", "DOCUMENT NAME", serverWidget.FieldType.TEXT],
      ["sales_date", "DATE", serverWidget.FieldType.DATE],
      ["sales_status", "STATUS", serverWidget.FieldType.TEXT],
      ["sales_customer_name", "CUSTOMER NAME", serverWidget.FieldType.TEXT],
      ["sales_subsidiary", "SUBSIDIARY", serverWidget.FieldType.TEXT],
      ["sales_class", "CLASS", serverWidget.FieldType.TEXT],
      ["sales_department", "DEPARTMENT", serverWidget.FieldType.TEXT],
      ["sales_subtotal", "SUBTOTAL", serverWidget.FieldType.TEXT],
      ["sales_tax", "TAX", serverWidget.FieldType.TEXT],
      ["sales_total", "TOTAL", serverWidget.FieldType.CURRENCY]
    ];

    fields.forEach(([id, label, type]) => {
      subList.addField({ id, label, type });
    });

    return subList;
  }

  /**
 * Executes a NetSuite sales order search using the specified filters and populates a sublist
 * with the grouped results, including converted tax, total, and subtotal values.
 *
 * The search aggregates key fields such as transaction ID, internal ID, date, status,
 * customer, subsidiary, department, class, and computes currency-adjusted tax, total,
 * and subtotal using formula columns.
 *
 * @param {Array} filters - An array of search filter expressions to narrow the sales order results.
 * @param {Sublist} subList - The Suitelet sublist object to populate with search result data.
 */

  function runSalesSearch(filters, subList) {
    const taxCol = search.createColumn({
      name: 'formulacurrency',
      summary: "MAX",
      formula: "{taxtotal} / {currency.exchangerate}",
      label: "ConvertedTax"
    });

    const totalCol = search.createColumn({
      name: 'formulacurrency',
      summary: "MAX",
      formula: "{totalamount} / {currency.exchangerate}",
      label: "ConvertedTotal"
    });

    const subtotalCol = search.createColumn({
      name: 'formulacurrency',
      summary: "SUM",
      formula: "{grossamount} / {currency.exchangerate}",
      label: "ConvertedSubtotal"
    });

    const salesSearch = search.create({
      type: search.Type.SALES_ORDER,
      filters: filters,
      columns: [
        search.createColumn({ name: "tranid", summary: "GROUP" }),
        search.createColumn({ name: "internalid", summary: "GROUP" }),
        search.createColumn({ name: "trandate", summary: "GROUP" }),
        search.createColumn({ name: "statusref", summary: "GROUP" }),
        search.createColumn({ name: "subsidiary", summary: "GROUP" }),
        search.createColumn({ name: "department", summary: "GROUP" }),
        search.createColumn({ name: "class", summary: "GROUP" }),
        search.createColumn({ name: "entity", summary: "GROUP" }),
        taxCol,
        totalCol,
        subtotalCol
      ]
    });

    const resultSet = salesSearch.run();
    let count = 0;

    resultSet.each((result) => {
      const cols = result.columns;

      subList.setSublistValue({ id: "internal_id", line: count, value: result.getValue(cols[1]) || "" });
      subList.setSublistValue({ id: "document_number", line: count, value: result.getValue(cols[0]) || "" });
      subList.setSublistValue({ id: "sales_date", line: count, value: result.getValue(cols[2]) || "" });
      subList.setSublistValue({ id: "sales_status", line: count, value: result.getText(cols[3]) || "" });
      subList.setSublistValue({ id: "sales_customer_name", line: count, value: result.getText(cols[7]) || "" });
      subList.setSublistValue({ id: "sales_subsidiary", line: count, value: result.getText(cols[4]) || "" });

      const dept = result.getText(cols[5]);
      subList.setSublistValue({ id: "sales_department", line: count, value: dept && dept !== "- None -" ? dept : "No Department" });

      const cls = result.getText(cols[6]);
      subList.setSublistValue({ id: "sales_class", line: count, value: cls && cls !== "- None -" ? cls : "No Class" });

      subList.setSublistValue({ id: "sales_tax", line: count, value: result.getValue(cols[8]) || "0" });
      subList.setSublistValue({ id: "sales_total", line: count, value: result.getValue(cols[9]) || "0" });
      subList.setSublistValue({ id: "sales_subtotal", line: count, value: result.getValue(cols[10]) || "0" });

      count++;
      return true;
    });
  }

  return { onRequest };
});