import base64
import mimetypes

def image_to_data_url(path):
    mime_type, _ = mimetypes.guess_type(path)
    if not mime_type:
        mime_type = "image/png"
    with open(path, 'rb') as img_file:
        encoded_str = base64.b64encode(img_file.read()).decode("utf-8")
    
    return f"data:{mime_type};base64,{encoded_str}"

data_uri = image_to_data_url("./static/logos/icon_h.png")

with open("result.txt", 'w') as txt_file:
    txt_file.write(data_uri)

