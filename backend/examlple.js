const createPost = async (req, res) => {
    const { post_content } = req.body;
    const user_id = req.user.user_id;
    const currentDate = new Date();
    const picFile = req.file;
    if (!picFile) {
      res.status(400);
      res.send("please provide a pic");
    }
    const picName = `user_${user_id}_picture_${currentDate.toISOString()}.jpg`;
    const bucket = storage.bucket(process.env.POST_BUCKET);
    const file = bucket.file(picName);
    try {
      await file.save(picFile.buffer);
      const [gcsPictureUrl] = await file.getSignedUrl({
        action: "read",
        expires: "2030-01-01",
      });
      await client.query(
        "insert into posts(post_content,post_image,created_date,user_id) values($1,$2,$3,$4) returning *",
        [post_content, gcsPictureUrl, currentDate, user_id]
      );
      res.send("created post");
    } catch (error) {
      console.log(error);
    }
  };