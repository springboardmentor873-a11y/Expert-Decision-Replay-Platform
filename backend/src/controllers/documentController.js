import prisma from "../db/prisma.js";

//upload document to the server

const uploadDocument = async (req, res) => {
  try {
    const { decisionId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const document = await prisma.document.create({
      data: {
        filename: req.file.originalname,
        filePath: req.file.path,
        decisionId: Number(decisionId),
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to upload document",
    });
  }
};

//get document from the server

const getDocuments = async (req, res) => {
  try {
    const { decisionId } = req.params;

    const documents = await prisma.document.findMany({
      where: {
        decisionId: Number(decisionId),
      },
    });

    res.status(200).json(documents);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch documents",
    });
  }
};

export { uploadDocument, getDocuments };
