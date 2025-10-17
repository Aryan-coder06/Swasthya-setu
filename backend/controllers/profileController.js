
import supabase from "../main_server.js";

const add_doc = async (req, res) => {
  const { userId } = req.body;
  const file = req.file;

  console.log("userID", userId);

  if (!file) {
    return res.status(400).json({ docError: "No file provided" });
  }

  const { data: uploadedDocument, error: docError } = await supabase.storage
    .from("User_Docs")
    .upload(`${userId}/${file.originalname}`, file.buffer, {
      contentType: file.mimetype,
    });

  if (docError) {
    console.log("Doc Error:", docError.message);
    return res.status(400).json({ docError: docError.message });
  }

  console.log("Uploaded Document:", uploadedDocument);

  const { data: userData, error: userError } = await supabase
    .from("Patient_Profile")
    .select("docs")
    .eq("id", userId)
    .single();

  if (userError) {
    console.log("User Error:", userError.message);
    return res.status(400).json({ docError: userError.message });
  }

  const updatedDocs = [...(userData.docs || []), { type: file.mimetype, path: uploadedDocument.path }];

  const { error: updateError } = await supabase
    .from("Patient_Profile")
    .update({ docs: updatedDocs })
    .eq("id", userId);

  if (updateError) {
    console.log("Update Error:", updateError.message);
    return res.status(400).json({ docError: updateError.message });
  }

  return res.status(200).json({ message: "Document uploaded successfully" });
};

const fetch_doc = async (req, res) => {
  const { userID } = req.body;

  console.log("userID:", userID);

  const { data: paths, error: path_error } = await supabase
    .from("Patient_Profile")
    .select("docs")
    .eq("id", userID)
    .single();

  if (path_error) {
    console.log("Path Error:", path_error.message);
    return res.status(400).json({ error: path_error.message });
  }

  console.log("Paths:", paths);
  let docs = [];
  for (let path of paths.docs || []) {
    console.log("Fetching signed URL for:", path.path);
    const { data: urlData, error: signedError } = await supabase
      .storage
      .from("User_Docs")
      .createSignedUrl(path.path, 60 * 60);

    if (signedError) {
      console.error("Signed URL error:", signedError);
      continue;
    }
    docs.push({ signedUrl: urlData.signedUrl, type: path.type, path: path.path });
  }

  console.log("Docs:", docs);
  res.json(docs);
};

const fetch_metadata = async (req, res) => {
  const { userID } = req.body;

  console.log("Fetching metadata for userID:", userID);

  const { data, error } = await supabase
    .from("Patient_Profile")
    .select("docs")
    .eq("id", userID)
    .single();

  if (error) {
    console.log("Metadata Error:", error.message);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
};


export { add_doc, fetch_doc, fetch_metadata };
