const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const targetPath = args[0];

// N.B. Needs a target-files text file with the list of files to scan.
const targetFilesConfig = path.join(__dirname, "./target-files.txt");

fs.readFile(targetFilesConfig, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file.");
    return;
  }

  let targetFiles = data
    .split("\n")
    .filter((text) => text !== "")
    .map((text) => text.split(" ")[0].split("@types/")[1]);

  const directoryPath = path.join(__dirname, targetPath);

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Error getting directory information.");

      return;
    }

    const mismatchFiles = [];
    let count = 0;

    for (const file of files) {
      if (targetFiles.includes(file)) {
        try {
          const data = fs
            .readFileSync(
              path.join(directoryPath, file, "./package.json"),
              "utf8",
            )
            .split("\n");

          const minimumTypeScriptVersionIdx = data.findIndex((text) =>
            text.includes("minimumTypeScriptVersion"),
          );
          const hasMinimumTypeScriptVersion =
            minimumTypeScriptVersionIdx !== -1;

          if (!hasMinimumTypeScriptVersion) {
            const dependenciesIdx = data.findIndex((text) =>
              text.includes("dependencies"),
            );

            if (dependenciesIdx !== -1) {
              const lineToInsert = '    "minimumTypeScriptVersion": "4.8",';

              // Insert the new line
              data.splice(dependenciesIdx, 0, lineToInsert);

              // Join back into a single string
              const updatedContent = data.join("\n");

              count += 1;

              try {
                fs.writeFileSync(
                  path.join(directoryPath, file, "./package.json"),
                  updatedContent,
                );
              } catch (err) {
                console.error("Error writing file.");
              }
            }
          }
        } catch (err) {
          console.error("Error reading file.");
        }
      }
    }

    console.log("Total files scanned: ", count);
    console.log("Total files: ", targetFiles.length);
  });
});
