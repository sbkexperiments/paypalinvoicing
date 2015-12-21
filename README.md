# paypalinvoicing

This extension shows a dashboard with your PayPal Invoicing Statistics (counts and amounts on invoices sent,paid,outstanding,overdue, etc..)

It uses browserify to generate background.bundle.js file used in manifest.json. So please do the following before loading the extension in the browser.

npm install request

browserify background.js -o background.bundle.js

Demo:
![alt tag](https://github.com/sbkexperiments/paypalinvoicing/blob/master/demo.png)
