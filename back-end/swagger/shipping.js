/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *           format: double
 *           description: Vĩ độ của vị trí
 *           example: 10.762622
 *         longitude:
 *           type: number
 *           format: double
 *           description: Kinh độ của vị trí
 *           example: 106.660172
 *
 *     ShipmentHistory:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Trạng thái vận chuyển
 *           example: Đang chuẩn bị hàng
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật trạng thái
 *         description:
 *           type: string
 *           description: Mô tả chi tiết về trạng thái
 *           example: Đơn hàng đang được chuẩn bị tại kho
 *
 *     ShippingInfo:
 *       type: object
 *       properties:
 *         trackingNumber:
 *           type: string
 *           description: Mã vận đơn
 *           example: GU1A2B3C4D5
 *         status:
 *           type: string
 *           description: Trạng thái vận chuyển hiện tại
 *           example: Đang chuẩn bị hàng
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo vận đơn
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *           description: Thời gian dự kiến giao hàng
 *         distance:
 *           type: number
 *           format: double
 *           description: Khoảng cách giao hàng (km)
 *           example: 5.2
 *         currentLocation:
 *           $ref: '#/components/schemas/Location'
 *         customerLocation:
 *           $ref: '#/components/schemas/Location'
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShipmentHistory'
 *
 *     CreateShipmentRequest:
 *       type: object
 *       required:
 *         - customerLocation
 *       properties:
 *         customerLocation:
 *           $ref: '#/components/schemas/Location'
 *
 *     CreateShipmentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         shipment:
 *           type: object
 *           properties:
 *             trackingNumber:
 *               type: string
 *             status:
 *               type: string
 *             estimatedDelivery:
 *               type: string
 *               format: date-time
 *             distance:
 *               type: number
 *
 *     ShipmentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         shipment:
 *           $ref: '#/components/schemas/ShippingInfo'
 *         order:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             order_code:
 *               type: string
 *             status:
 *               type: string
 *             customer_id:
 *               type: string
 *
 *     ShipperLocationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         status:
 *           type: string
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *
 *     UpdateShipmentRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           description: Trạng thái mới của vận đơn
 *           example: Đang vận chuyển
 *         description:
 *           type: string
 *           description: Mô tả chi tiết về cập nhật trạng thái
 *         location:
 *           $ref: '#/components/schemas/Location'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         error:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: API quản lý vận chuyển
 */

/**
 * @swagger
 * /api/shipping/create/{orderId}:
 *   post:
 *     summary: Tạo vận đơn mới cho đơn hàng
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShipmentRequest'
 *     responses:
 *       200:
 *         description: Tạo vận đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateShipmentResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/shipping/tracking/{trackingNumber}:
 *   get:
 *     summary: Lấy thông tin vận chuyển theo mã vận đơn
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã vận đơn cần tra cứu
 *     responses:
 *       200:
 *         description: Thông tin vận chuyển
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShipmentResponse'
 *       404:
 *         description: Không tìm thấy thông tin vận chuyển
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/shipping/location/{trackingNumber}:
 *   get:
 *     summary: Lấy vị trí hiện tại của shipper
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã vận đơn cần tra cứu vị trí
 *     responses:
 *       200:
 *         description: Vị trí hiện tại của shipper
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShipperLocationResponse'
 *       404:
 *         description: Không tìm thấy thông tin shipper
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/shipping/{trackingNumber}:
 *   put:
 *     summary: Cập nhật trạng thái vận chuyển
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã vận đơn cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateShipmentRequest'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 shipment:
 *                   $ref: '#/components/schemas/ShippingInfo'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy thông tin vận chuyển
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
