/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
/***************************************************************************************************************************************
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
define(["N/log", "N/search", "N/ui/serverWidget"], (log, search, serverWidget) => {
  const onRequest = (scriptContext) => {
    if (scriptContext.request.method === "GET") {
      try {
        let form = serverWidget.createForm({ title: "Sales Order" });
        form.clientScriptFileId = 2512;
 
        
        let custStatus = form.addField({
          id: "cust_status",
          label: "STATUS",
          type: serverWidget.FieldType.SELECT,
        });
        custStatus.addSelectOption({ value: "", text: "" });
        custStatus.addSelectOption({ value: "SalesOrd:B", text: "Pending Fulfillment" });
        custStatus.addSelectOption({ value: "SalesOrd:D", text: "Partially Fulfilled" });
        custStatus.addSelectOption({ value: "SalesOrd:E", text: "Pending Billing/Partially Fulfilled" });
        custStatus.addSelectOption({ value: "SalesOrd:F", text: "Pending Billing" });
 
        let custCustomer = form.addField({
          id: "cust_customer",
          label: "CUSTOMER",
          type: serverWidget.FieldType.SELECT,
          source: "customer",
        });
 
        let custSubsidiary = form.addField({
          id: "cust_subsidiary",
          label: "SUBSIDIARY",
          type: serverWidget.FieldType.SELECT,
          source: "subsidiary",
        });
 
        let custDepartment = form.addField({
          id: "cust_department",
          label: "DEPARTMENT",
          type: serverWidget.FieldType.SELECT,
          source: "department",
        });
 
        
        let subList = form.addSublist({
          id: "sales_sublist",
          label: "Sales Details",
          type: serverWidget.SublistType.LIST,
        });
 
        subList.addField({ id: "internal_id", label: "INTERNAL ID", type: serverWidget.FieldType.INTEGER });
        subList.addField({ id: "document_number", label: "DOCUMENT NAME", type: serverWidget.FieldType.TEXT });
        subList.addField({ id: "sales_date", label: "DATE", type: serverWidget.FieldType.DATE });
        subList.addField({ id: "sales_status", label: "STATUS", type: serverWidget.FieldType.TEXT });
        subList.addField({ id: "sales_customer_name", label: "CUSTOMER NAME", type: serverWidget.FieldType.TEXT });
        subList.addField({ id: "sales_subsidiary", label: "SUBSIDIARY", type: serverWidget.FieldType.TEXT });
        subList.addField({ id: "sales_class", label: "CLASS", type: serverWidget.FieldType.TEXT });
        subList.addField({ id: "sales_department", label: "DEPARTMENT", type: serverWidget.FieldType.TEXT });
        subList.addField({ id: "sales_subtotal", label: "SUBTOTAL", type: serverWidget.FieldType.TEXT });
        subList.addField({ id: "sales_tax", label: "TAX", type: serverWidget.FieldType.TEXT });
        subList.addField({ id: "sales_total", label: "TOTAL", type: serverWidget.FieldType.CURRENCY });
 
       
        let customerName = scriptContext.request.parameters.customer_name;
        let customerSubsidiary = scriptContext.request.parameters.cust_subsidiary;
        let customerDepartment = scriptContext.request.parameters.cust_department;
        let customerStatus = scriptContext.request.parameters.cust_status;
 
       
        custStatus.defaultValue = customerStatus || "";
        custSubsidiary.defaultValue = customerSubsidiary || "";
        custDepartment.defaultValue = customerDepartment || "";
        custCustomer.defaultValue = customerName || "";
 
        let filter = [
          ["mainline", "is", "F"], "AND",
          ["shipping", "is", "F"], "AND",
          ["cogs", "is", "F"], "AND",
          ["item.type", "noneof", "Discount"], "AND",
          ["taxline", "is", "F"]
        ];
 
        if (
          customerStatus ||
          customerName ||
          customerSubsidiary ||
          customerDepartment
        ) {
          if (customerName !== " ") {
            filter.push("AND", ["entity", "anyof", customerName]);
           
          }
          if (customerSubsidiary !== " ") {
            filter.push("AND", ["subsidiary", "is", customerSubsidiary]);
           
          }
          if (customerDepartment !== " ") {
            filter.push("AND", ["department", "is", customerDepartment]);
          }
          if (customerStatus !== " ") {
            filter.push("AND", ["status", "is", customerStatus]);
           
          }
        }
 
       
        let taxCol = search.createColumn({
          name: 'formulacurrency',
          summary: "SUM",
          formula: "{taxtotal} / {currency.exchangerate}",
          label: "ConvertedTax"
        });
 
        let totalCol = search.createColumn({
          name: 'formulacurrency',
          summary: "SUM",
          formula: "{totalamount} / {currency.exchangerate}",
          label: "ConvertedTotal"
        });
 
        let subtotalCol = search.createColumn({
          name: 'formulacurrency',
          summary: "SUM",
          formula: "{grossamount} / {currency.exchangerate}",
          label: "ConvertedSubtotal"
        });
 
        let salesOrderSearch = search.create({
          type: search.Type.SALES_ORDER,
          filters: filter,
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
 
        let resultSet = salesOrderSearch.run();
        let count = 0;
 
        resultSet.each(function (result) {
          let cols = result.columns;
 
          subList.setSublistValue({
            id: "internal_id",
            line: count,
            value: result.getValue({ name: cols[1] })
          });
 
          subList.setSublistValue({
            id: "document_number",
            line: count,
            value: result.getValue({ name: cols[0] })
          });
 
          subList.setSublistValue({
            id: "sales_date",
            line: count,
            value: result.getValue({ name: cols[2] })
          });
 
          subList.setSublistValue({
            id: "sales_status",
            line: count,
            value: result.getText({ name: cols[3] })
          });
 
          subList.setSublistValue({
            id: "sales_customer_name",
            line: count,
            value: result.getText({ name: cols[7] })
          });
 
          subList.setSublistValue({
            id: "sales_subsidiary",
            line: count,
            value: result.getText({ name: cols[4] })
          });

          let deptText = result.getText({ name: cols[5] });
          subList.setSublistValue({
            id: "sales_department",
            line: count,
           value: (deptText && deptText !== "- None -") ? deptText : "No Department"
          });
           let classText = result.getText({ name: cols[6] });
          subList.setSublistValue({
            id: "sales_class",
            line: count,
            value: (classText && classText !== "- None -") ? classText : "No Class"
          });
 
          subList.setSublistValue({
            id: "sales_tax",
            line: count,
            value: result.getValue({ name: cols[8] }) || "0"
          });
 
          subList.setSublistValue({
            id: "sales_total",
            line: count,
            value: result.getValue({ name: cols[9] }) || "0"
          });
 
          subList.setSublistValue({
            id: "sales_subtotal",
            line: count,
            value: result.getValue({ name: cols[10] }) || "0"
          });
 
          count++;
          return true;
        });
 
        form.addButton({
          id: "custpage_reset",
          label: "Reset",
          functionName: "onResetFilters"
        });
 
        scriptContext.response.writePage(form);
      } catch (error) {
        log.error("Error in Suitelet", error);
      }
    }
  };
 
  return { onRequest };
});
 