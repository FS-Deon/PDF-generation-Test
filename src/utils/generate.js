import puppeteer from "puppeteer";
import hbs from "handlebars";
import moment from "moment";
import path from "path";
import fs from "fs";

const compile = async function (templateName, data) {
  const filePath = path.join(process.cwd(), "templates", `${templateName}.hbs`);
  const html = fs.readFileSync(filePath, { encoding: "utf-8" });
  return hbs.compile(html)(data);
};

hbs.registerHelper("dateFormat", function (value, format) {
  console.log("formatting", value, format);
  return moment(value).format(format);
});

const generatePDF = async function (data) {
  return new Promise(async (resolve, reject) => {
    const logs = [];
    try {
      let i = 0;
      console.time("overall");
      const mem = process.memoryUsage();
      console.log(`Before Generation: ${mem.rss / (1024 * 1024)} MB`);
      for (i; i < data.length; i++) {
        const browser = await puppeteer.launch();
        console.time("pdf");
        const page = await browser.newPage();

        const content = await compile("template", data[i]);
        await page.setContent(content);
        await page.pdf({
          path: `./temp/mypdf${i}.pdf`,
          format: "A4",
          printBackground: true,
        });
        console.timeEnd("pdf");
        const mem = process.memoryUsage();
        console.log(`Current Mem: ${mem.rss / (1024 * 1024)} MB`);
        await browser.close();
        const log = {
          filePath: `./temp/mypdf${i}.pdf`,
          fileName: `mypdf${i}.pdf`,
          recipient: data[i].employeeEmail,
          fullName: data[i].employeeName,
          companyName: data[i].companyName,
        };

        logs.push(log);
      }
      console.timeEnd("overall");
      resolve(logs);
    } catch (e) {
      reject(e);
    }
  });
};

export default generatePDF;
