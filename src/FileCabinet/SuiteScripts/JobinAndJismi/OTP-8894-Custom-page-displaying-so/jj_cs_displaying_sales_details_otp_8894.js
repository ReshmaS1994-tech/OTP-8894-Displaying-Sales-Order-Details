/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
******************************************************************************************************************
* Client Name
*
*
*
${OTP-8894}:{Custom page for display sales order based on the status}
*
*
*******************************************************************************************************************
*
*Author:Jobin and Jismi IT Services
*
*Date Created:06-june-2025
*
*Description:A client script was developed to enhance interactivity, capturing user inputs and dynamically updating 
the sublist without requiring a full page reload 
*
*REVISION HISTORY
*@version 1.0 04-June-2025 :Created the initial build by JJ0402
*******************************************************************************************************************
*/
define(["N/log", "N/url"], /**
 * @param{log} log
 * @param{url} url
 */
function (log, url) {
  /**
   * Function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @since 2015.2
   */
  function fieldChanged(scriptContext) {
    try {
      if (
        scriptContext.fieldId === "cust_customer" ||
        scriptContext.fieldId === "cust_status" ||
        scriptContext.fieldId === "cust_subsidiary" ||
        scriptContext.fieldId === "cust_department"
      ) {
        let curRecord = scriptContext.currentRecord;

        let custDepartment =
          curRecord.getValue({ fieldId: "cust_department" }) || " ";
        let custSubsidiary =
          curRecord.getValue({ fieldId: "cust_subsidiary" }) || " ";
        let custCustomer =
          curRecord.getValue({ fieldId: "cust_customer" }) || " ";
        let custStatus = curRecord.getValue({ fieldId: "cust_status" }) || " ";
      
        let suiteletUrl = url.resolveScript({
          scriptId: "customscript_jj_sl_display_sales_order",
          deploymentId: "customdeploy_jj_sl_so_details",
          params: {
            customer_name: custCustomer,
            cust_status: custStatus,
            cust_subsidiary: custSubsidiary,
            cust_department: custDepartment,
          },
        });
        
        window.onbeforeunload = null;
        window.location.href = suiteletUrl;
      }
    } catch (error) {
      log.error("error..", error.message);
    }
  }
  /**
 * Redirects the user to the base Suitelet URL, effectively resetting all applied filters.
 *
 * This function is intended to be used as a client-side "Reset" button handler. It uses
 * NetSuite's `url.resolveScript` API to reconstruct the Suitelet's base URL using the
 * given script and deployment IDs, and then reloads the page.
 *
 * @function
 * @returns {void}
 */

  function onResetFilters() {
 
            try {
              var suiteletUrl = url.resolveScript({
                scriptId: "customscript_jj_sl_display_sales_order",
                deploymentId: "customdeploy_jj_sl_so_details",
              });
              window.location.href = suiteletUrl;
            } catch (e) {
              log.error("Reset Error", e.message);
            }
        
          }


  return {
    fieldChanged: fieldChanged,
    onResetFilters: onResetFilters,
  };
});
