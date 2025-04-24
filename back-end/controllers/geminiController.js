require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const Product = require("../models/Product");
const Category = require("../models/Category");

// Khởi tạo Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Thông tin về GearUp để cung cấp cho chatbot
const systemPrompt = `
Bạn là trợ lý AI của GearUp, một cửa hàng chuyên bán các thiết bị và phụ kiện gaming cao cấp và điện thoại. 
Thông tin về GearUp:
- Sản phẩm chính:laptop, điện thoại, phụ kiện, máy tính bảng
- Các thương hiệu: Logitech, Razer, SteelSeries, Corsair, ASUS ROG, MSI, HyperX, Apple, Samsung
- Chính sách: Bảo hành 12-24 tháng, đổi trả trong 30 ngày, giao hàng toàn quốc
- Ưu đãi: Giảm 10% cho học sinh/sinh viên với mã "BACKTOSCHOOL", chương trình khách hàng thân thiết
- Hiện tại GearUp chỉ bán online thông qua website: gearup.vn
- Hotline: 1900 1234

Khi người dùng hỏi về sản phẩm cụ thể, số lượng sản phẩm, hoặc giá cả, bạn sẽ truy vấn API để lấy thông tin chính xác.
Hãy trả lời thân thiện, ngắn gọn và chính xác về các sản phẩm, dịch vụ và chính sách của GearUp.
Luôn cung cấp câu trả lời ngắn gọn, súc tích, không quá 3-4 câu trừ khi cần thiết.

Lưu ý đặc biệt: 
- Khi người dùng hỏi về ưu đãi cho sinh viên, hãy nhớ rằng GearUp có chương trình giảm giá 10% cho học sinh/sinh viên khi họ sử dụng mã "BACKTOSCHOOL" và xuất trình thẻ học sinh/sinh viên hợp lệ.
- Khi người dùng hỏi về địa chỉ cửa hàng, hãy thông báo rằng GearUp hiện chỉ bán online thông qua website gearup.vn và không có cửa hàng vật lý.
`;

// Hàm xử lý truy vấn thông tin sản phẩm
const getProductInfo = async (query) => {
  try {
    let response = {};

    // Lấy tổng số sản phẩm
    if (query === "count") {
      const count = await Product.countDocuments();
      response = { 
        count, 
        message: `Hiện tại GearUp có ${count} sản phẩm trong kho.` 
      };
    } 
    // Lấy danh sách danh mục sản phẩm
    else if (query === "categories") {
      try {
        // Lấy tất cả danh mục
        const categories = await Category.find();
        
        if (!categories || categories.length === 0) {
          response = {
            success: false,
            message: "Không tìm thấy danh mục sản phẩm nào."
          };
        } else {
          // Tạo danh sách tên danh mục
          const categoryList = categories.map(cat => ({
            name: cat.name,
            subCategories: cat.sub_categories ? cat.sub_categories.map(sub => sub.name) : []
          }));
          
          response = {
            success: true,
            categories: categoryList,
            message: `GearUp có ${categories.length} danh mục sản phẩm chính.`
          };
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        response = {
          success: false,
          message: "Đã xảy ra lỗi khi lấy thông tin danh mục."
        };
      }
    }
    // Lấy danh sách thương hiệu
    else if (query === "brands") {
      const categories = await Category.find();
      const brands = [];
      
      // Thu thập tất cả thương hiệu từ các danh mục
      categories.forEach(category => {
        if (category.sub_categories && Array.isArray(category.sub_categories)) {
          category.sub_categories.forEach(sub => {
            brands.push(sub.name);
          });
        }
      });
      
      // Loại bỏ các thương hiệu trùng lặp
      const uniqueBrands = [...new Set(brands)];
      
      response = {
        brands: uniqueBrands,
        message: `GearUp có các thương hiệu:\n${uniqueBrands.join(', ')}`
      };
    }
    // Lấy sản phẩm theo tên
    else if (query.startsWith("find:")) {
      const searchTerm = query.substring(5).trim();
      console.log("Tìm kiếm sản phẩm với từ khóa:", searchTerm);
      
      // Đảm bảo lấy tất cả các trường của sản phẩm
      const products = await Product.find({
        name: { $regex: searchTerm, $options: 'i' }
      }).lean().limit(5);  // Thêm .lean() để chuyển đổi Mongoose document thành plain JavaScript object
      
      console.log("Kết quả tìm kiếm:", products.length, "sản phẩm");
      
      if (products.length > 0) {
        // Log toàn bộ sản phẩm đầu tiên để kiểm tra cấu trúc
        console.log("Chi tiết sản phẩm đầu tiên:", JSON.stringify(products[0], null, 2));
      }
      
      if (products.length === 0) {
        // Xử lý khi không tìm thấy sản phẩm
        response = { 
          products: [], 
          message: `Không tìm thấy sản phẩm nào có tên "${searchTerm}".` 
        };
      } else {
        // Lấy danh sách các danh mục để tìm tên thương hiệu
        const categories = await Category.find();
        
        const productList = products.map(p => {
          // Tìm tên thương hiệu từ ID
          let brandName = "Không xác định";
          if (p.brand) {
            for (const category of categories) {
              if (category.sub_categories && Array.isArray(category.sub_categories)) {
                const subCategory = category.sub_categories.find(
                  sub => sub._id && p.brand && sub._id.toString() === p.brand.toString()
                );
                if (subCategory) {
                  brandName = subCategory.name;
                  break;
                }
              }
            }
          }
          
          // Kiểm tra và xử lý màu sắc
          console.log("Dữ liệu màu sắc gốc:", p.name, p.colors);
          
          let colors = ["Chưa cập nhật thông tin màu sắc"];
          if (p.colors && Array.isArray(p.colors) && p.colors.length > 0) {
            colors = p.colors;
            console.log("Đã tìm thấy màu sắc:", colors);
          } else {
            console.log("Không tìm thấy thông tin màu sắc cho sản phẩm:", p.name);
          }
          
          return {
            name: p.name,
            brand: brandName,
            price: Math.min(...p.variants.map(v => v.price)),
            stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
            colors: colors
          };
        });
        
        response = { 
          products: productList,
          message: `Tìm thấy ${products.length} sản phẩm phù hợp với "${searchTerm}".` 
        };
      }
    } 
    // Lấy sản phẩm theo thương hiệu
    else if (query.startsWith("brand:")) {
      const brandName = query.substring(6).trim();
      console.log("Tìm kiếm sản phẩm theo thương hiệu:", brandName);
      
      // Tìm brand_id từ tên thương hiệu
      const categories = await Category.find();
      let brandId = null;
      
      // Tìm trong tất cả các danh mục
      for (const category of categories) {
        if (category.sub_categories && Array.isArray(category.sub_categories)) {
          const subCategory = category.sub_categories.find(
            sub => sub.name.toLowerCase() === brandName.toLowerCase()
          );
          if (subCategory) {
            brandId = subCategory._id;
            break;
          }
        }
      }
      
      if (!brandId) {
        response = { 
          products: [], 
          message: `Không tìm thấy thương hiệu "${brandName}".` 
        };
      } else {
        const products = await Product.find({ 
          brand: brandId 
        }).limit(5);
        
        if (products.length === 0) {
          response = { 
            products: [], 
            message: `Không có sản phẩm nào thuộc thương hiệu "${brandName}".` 
          };
        } else {
          const productList = products.map(p => ({
            name: p.name,
            brand: brandName,
            price: Math.min(...p.variants.map(v => v.price)),
            stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
            colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ["Chưa cập nhật thông tin màu sắc"]
          }));
          
          response = { 
            products: productList,
            message: `Tìm thấy ${products.length} sản phẩm thuộc thương hiệu "${brandName}".` 
          };
        }
      }
    }
    // Lấy sản phẩm theo khoảng giá
    else if (query.startsWith("price:")) {
      const priceRange = query.substring(6).trim();
      const [minPrice, maxPrice] = priceRange.split('-').map(p => parseInt(p.trim()));
      
      const products = await Product.find({
        "variants.price": { $gte: minPrice, $lte: maxPrice }
      }).limit(5);
      
      if (products.length === 0) {
        response = { 
          products: [], 
          message: `Không tìm thấy sản phẩm nào trong khoảng giá ${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ.` 
        };
      } else {
        const productList = products.map(p => ({
          name: p.name,
          price: Math.min(...p.variants.map(v => v.price)),
          stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
          colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ["Chưa cập nhật thông tin màu sắc"]
        }));
        
        response = { 
          products: productList,
          message: `Tìm thấy ${products.length} sản phẩm trong khoảng giá ${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ.` 
        };
      }
    }
    // Lấy sản phẩm theo danh mục
    else if (query.startsWith("category:")) {
      const categoryName = query.substring(9).trim();
      
      // Tìm category_id dựa trên tên
      const category = await Category.findOne({ 
        name: { $regex: categoryName, $options: 'i' } 
      });
      
      if (!category) {
        response = { 
          products: [], 
          message: `Không tìm thấy danh mục "${categoryName}".` 
        };
      } else {
        const products = await Product.find({ 
          category_id: category._id 
        }).limit(5);
        
        if (products.length === 0) {
          response = { 
            products: [], 
            message: `Không có sản phẩm nào thuộc danh mục "${category.name}".` 
          };
        } else {
          const productList = products.map(p => ({
            name: p.name,
            price: Math.min(...p.variants.map(v => v.price)),
            stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
            colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ["Chưa cập nhật thông tin màu sắc"]
          }));
          
          response = { 
            products: productList,
            message: `Tìm thấy ${products.length} sản phẩm thuộc danh mục "${category.name}".` 
          };
        }
      }
    }
    // Lấy sản phẩm có sẵn trong kho
    else if (query === "instock") {
      // Đếm tổng số sản phẩm còn hàng
      const totalInStock = await Product.countDocuments({
        "variants.stock": { $gt: 0 }
      });
      
      // Lấy 5 sản phẩm đầu tiên để hiển thị
      const products = await Product.find({
        "variants.stock": { $gt: 0 }
      }).limit(5);
      
      if (products.length === 0) {
        response = { 
          products: [], 
          message: `Hiện tại không có sản phẩm nào còn hàng trong kho.` 
        };
      } else {
        const productList = products.map(p => ({
          name: p.name,
          price: Math.min(...p.variants.map(v => v.price)),
          stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
          colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ["Chưa cập nhật thông tin màu sắc"]
        }));
        
        const productNames = productList.map(p => p.name).join(', ');
        
        response = { 
          products: productList,
          totalInStock: totalInStock,
          message: `Hiện có tổng cộng ${totalInStock} sản phẩm còn hàng. Đây là 5 sản phẩm tiêu biểu: ${productNames}. Tổng số lượng của 5 sản phẩm này là ${productList.reduce((sum, p) => sum + p.stock, 0)} sản phẩm.` 
        };
      }
    }
    // Mặc định trả về thông báo lỗi
    else {
      response = { 
        error: true, 
        message: "Không hiểu yêu cầu truy vấn." 
      };
    }

    return response;
  } catch (error) {
    console.error("Lỗi khi truy vấn thông tin sản phẩm:", error);
    return { 
      error: true, 
      message: "Đã xảy ra lỗi khi truy vấn thông tin sản phẩm." 
    };
  }
};

exports.getGeminiResponse = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Vui lòng nhập tin nhắn" });
    }

    try {
        // Thêm log để debug
        console.log("Tin nhắn nhận được:", message);

        // Kiểm tra xem tin nhắn có phải là truy vấn về sản phẩm không
        const productQueries = [
            // Đặt các regex cụ thể lên trước
            { regex: /tìm.*?sản phẩm\s+([\w\s]+)/i, query: (match) => `find:${match[1]}` },
            { regex: /tìm\s+([\w\s]+)/i, query: (match) => `find:${match[1]}` },
            { regex: /giá.*?từ.*?(\d+).*?đến.*?(\d+)/i, query: (match) => `price:${match[1]}-${match[2]}` },
            { regex: /giá.*?([\w\s]+)/i, query: (match) => `find:${match[1]}` },
            { regex: /danh mục.*?([\w\s]+)/i, query: (match) => `category:${match[1]}` },
            { regex: /thương hiệu.*?([\w\s]+)/i, query: (match) => `brand:${match[1]}` },
            { regex: /hãng.*?([\w\s]+)/i, query: (match) => `brand:${match[1]}` },
            { regex: /còn hàng|có sẵn/i, query: "instock" },
            // Sửa regex cho truy vấn màu sắc
            { regex: /([\w\s]+)\s+có\s+màu\s+(sắc\s+)?gì/i, query: (match) => `find:${match[1].trim()}` },
            { regex: /màu\s+sắc\s+(của\s+)?([\w\s]+)/i, query: (match) => `find:${match[2].trim()}` },
            { regex: /màu\s+(của\s+)?([\w\s]+)/i, query: (match) => `find:${match[2].trim()}` },
            // Thêm regex cho truy vấn danh mục và thương hiệu
            { regex: /có\s+những\s+thương\s+hiệu\s+gì|thương\s+hiệu\s+nào|hãng\s+nào/i, query: "brands" },
            { regex: /có\s+những\s+sản\s+phẩm\s+gì|sản\s+phẩm\s+nào|danh\s+mục\s+nào|sản\s+phẩm\s+gì/i, query: "categories" },
            // Đặt regex chung xuống cuối
            { regex: /sản phẩm|hàng hóa|mặt hàng/i, query: "count" }
        ];

        let productInfo = null;
        let queryMatched = false;
        let isColorQuery = false;
        
        // Kiểm tra nếu là truy vấn về màu sắc
        if (message.toLowerCase().match(/([\w\s]+)\s+có\s+màu\s+(sắc\s+)?gì/i) || 
            message.toLowerCase().match(/màu\s+sắc\s+(của\s+)?([\w\s]+)/i) ||
            message.toLowerCase().match(/màu\s+(của\s+)?([\w\s]+)/i)) {
            isColorQuery = true;
            console.log("Đây là truy vấn về màu sắc");
        }
        
        // Kiểm tra xem tin nhắn có khớp với bất kỳ truy vấn sản phẩm nào không
        for (const { regex, query } of productQueries) {
            const match = message.match(regex);
            if (match) {
                queryMatched = true;
                console.log("Regex khớp:", regex);
                console.log("Match:", match);
                
                try {
                    const queryString = typeof query === 'function' ? query(match) : query;
                    console.log("Query string:", queryString);
                    
                    // Xử lý trường hợp đặc biệt cho "Tìm sản phẩm X"
                    if (regex.toString().includes("tìm") && match[1]) {
                        console.log("Tìm kiếm sản phẩm cụ thể:", match[1]);
                    }
                    
                    // Gọi hàm truy vấn thông tin sản phẩm trực tiếp
                    productInfo = await getProductInfo(queryString);
                    break;
                } catch (error) {
                    console.error("Lỗi khi xử lý truy vấn:", error);
                }
            }
        }

        // Xử lý trường hợp đặc biệt
        if (!queryMatched) {
            // Kiểm tra xem có phải là truy vấn tìm kiếm không
            const searchMatch = message.match(/tìm\s+([\w\s]+)/i);
            if (searchMatch) {
                console.log("Truy vấn tìm kiếm trực tiếp:", searchMatch[1]);
                productInfo = await getProductInfo(`find:${searchMatch[1]}`);
            }
            // Kiểm tra từ khóa iPhone
            else if (message.toLowerCase().includes('iphone')) {
                console.log("Truy vấn iPhone trực tiếp");
                productInfo = await getProductInfo("find:iPhone");
            }
            // Kiểm tra từ khóa Samsung
            else if (message.toLowerCase().includes('samsung')) {
                console.log("Truy vấn Samsung trực tiếp");
                productInfo = await getProductInfo("find:Samsung");
            }
        }

        // Khởi tạo model và chat
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Hãy giới thiệu về GearUp" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Xin chào! Tôi là trợ lý AI của GearUp - cửa hàng online chuyên cung cấp các thiết bị và phụ kiện gaming cao cấp. Chúng tôi có đầy đủ các sản phẩm từ bàn phím cơ, chuột gaming, tai nghe, ghế gaming đến màn hình, PC và laptop gaming từ các thương hiệu nổi tiếng như Logitech, Razer, SteelSeries, Corsair, ASUS ROG, MSI và HyperX. GearUp cam kết mang đến trải nghiệm mua sắm tuyệt vời với chính sách bảo hành 12-24 tháng, đổi trả trong 30 ngày và giao hàng toàn quốc. Tôi có thể giúp gì cho bạn hôm nay?" }],
                },
                {
                    role: "user",
                    parts: [{ text: "Địa chỉ cửa hàng ở đâu?" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hiện tại, GearUp chỉ hoạt động online thông qua website gearup.vn. Chúng tôi không có cửa hàng vật lý, nhưng đảm bảo giao hàng nhanh chóng và an toàn đến tận nơi cho khách hàng trên toàn quốc. Bạn có thể dễ dàng đặt hàng trực tuyến và theo dõi đơn hàng của mình qua website của chúng tôi." }],
                },
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });
        
        let userMessage = message;
        
        // Nếu có thông tin sản phẩm, thêm vào tin nhắn
        if (productInfo) {
            // Kiểm tra nếu là truy vấn danh mục
            if (productInfo.categories) {
                userMessage += "\n\nDanh mục sản phẩm tại GearUp:";
                productInfo.categories.forEach(category => {
                    userMessage += `\n${category.name}`;
                    if (category.subCategories && category.subCategories.length > 0) {
                        category.subCategories.forEach(sub => {
                            userMessage += `\n- ${sub}`;
                        });
                    }
                });
            } 
            // Kiểm tra nếu là truy vấn sản phẩm
            else if (productInfo.products && productInfo.products.length >= 0) {
                if (productInfo.products.length === 0 && isColorQuery) {
                    // Xử lý truy vấn màu sắc không tìm thấy sản phẩm
                    const searchTerm = message.match(/(màu\s+sắc|màu).*?([\w\s]+)/i)?.[2] || 
                                      message.match(/([\w\s]+)\s+có\s+màu\s+gì/i)?.[1];
                    userMessage = `Rất tiếc, sản phẩm "${searchTerm}" hiện không có trong hệ thống của GearUp. Vui lòng kiểm tra lại tên sản phẩm hoặc liên hệ với chúng tôi qua hotline 1900 1234 để được tư vấn về các sản phẩm tương tự.`;
                } else {
                    userMessage += `\n\nThông tin sản phẩm từ hệ thống:\n${productInfo.message}`;
                    
                    if (productInfo.products.length > 0) {
                        userMessage += "\n\nDanh sách sản phẩm:";
                        productInfo.products.forEach(product => {
                            const brandInfo = product.brand ? ` - ${product.brand}` : '';
                            
                            // Xử lý màu sắc an toàn
                            let colorInfo = ' (Chưa cập nhật thông tin màu sắc)';
                            if (product.colors && Array.isArray(product.colors) && product.colors.length > 0 && 
                                product.colors[0] !== "Chưa cập nhật thông tin màu sắc") {
                              colorInfo = ` (Có các màu: ${product.colors.join(', ')})`;
                            }
                            
                            userMessage += `\n- ${product.name}${brandInfo}${colorInfo}: ${product.price.toLocaleString('vi-VN')}đ (Còn ${product.stock} sản phẩm)`;
                        });
                        
                        // Thêm thông tin về tổng số sản phẩm nếu có
                        if (productInfo.totalInStock && productInfo.totalInStock > productInfo.products.length) {
                            userMessage += `\n\nLưu ý: Đây chỉ là 5 sản phẩm tiêu biểu trong tổng số ${productInfo.totalInStock} sản phẩm còn hàng.`;
                        }
                        
                        userMessage += "\n\nHãy sử dụng thông tin chính xác từ danh sách sản phẩm này trong câu trả lời của bạn.";
                    }
                }
            }
            // Trường hợp có thông tin nhưng không phải danh sách sản phẩm hoặc danh mục
            else {
                userMessage += `\n\nThông tin từ hệ thống:\n${productInfo.message || "Không có thông tin chi tiết."}`;
            }
        }
        
        // Gửi tin nhắn và nhận phản hồi
        const result = await chat.sendMessage(userMessage + "\n\nHãy trả lời ngắn gọn, súc tích trong 3-4 câu.");
        let response = result.response.text();

        // Chỉ kiểm tra và sửa đổi phản hồi về ưu đãi sinh viên nếu người dùng hỏi về nó
        if (message.toLowerCase().includes("ưu đãi") && message.toLowerCase().includes("sinh viên")) {
            if (!response.includes("BACKTOSCHOOL") || !response.includes("10%")) {
                response = "Có! GearUp có chương trình ưu đãi giảm 10% cho học sinh và sinh viên khi mua sắm. Bạn cần sử dụng mã 'BACKTOSCHOOL' khi thanh toán và xuất trình thẻ học sinh/sinh viên hợp lệ để được giảm giá.";
            }
        }

        res.json({ response });
    } catch (error) {
        console.error("Lỗi Gemini AI:", error);
        console.error("Error details:", error.message, error.stack);
        res.status(500).json({ error: "Lỗi máy chủ khi xử lý chatbot." });
    }
};
