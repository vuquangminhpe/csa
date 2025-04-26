import React, { useState, useEffect } from "react";
import { List, Avatar, Button, Input, message, Pagination, Modal } from "antd";
import axios from "axios";
import moment from "moment";
import { SendOutlined, EditOutlined } from "@ant-design/icons";
import "./ManageQuestions.css";

const API_BASE_URL = "http://localhost:9999/api";

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [answerText, setAnswerText] = useState({});
  const [editingAnswer, setEditingAnswer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const user = JSON.parse(localStorage.getItem("user"));
  const saleId = user?._id;
  const authToken = localStorage.getItem("authToken");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAnswerText, setEditingAnswerText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isQuestionModalVisible, setIsQuestionModalVisible] = useState(false);

  const statusTranslations = {
    all: "Tất cả",
    pending: "Chờ duyệt",
    approved: "Đã trả lời",
    rejected: "Từ chối",
    removed: "Đã gỡ",
  };


  useEffect(() => {
    fetchQuestions(); // Gọi API mỗi khi thay đổi filter hoặc phân trang
  }, [filter, currentPage, pageSize]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/question/user/all`, {
        params: {
          page: currentPage,
          limit: pageSize,
          sort: "desc",
          status: filter !== "all" ? filter : undefined,  // Thay đổi từ filter thành status
        },
        headers: { Authorization: `Bearer ${authToken}` },
      });

      console.log("Dữ liệu nhận được từ API:", response.data);
      setQuestions(response.data.questions);
      setTotalQuestions(response.data.totalQuestions);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error.response?.data || error.message);
      message.error("Không thể tải danh sách câu hỏi.");
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset lại trang hiện tại về trang đầu tiên khi thay đổi bộ lọc
  };
  const handleAnswerQuestion = async (questionId) => {
    if (!answerText[questionId] || answerText[questionId].trim().length < 5) {
      message.warning("Câu trả lời phải có ít nhất 5 ký tự!");
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/question/${questionId}/answer`,
        { answer: answerText[questionId], saleId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      message.success("Câu trả lời đã được gửi.");
      setAnswerText({ ...answerText, [questionId]: "" });
      setIsQuestionModalVisible(false);
      await fetchQuestions();
    } catch (error) {
      message.error("Không thể gửi câu trả lời.");
    }
  };

  const handleEditAnswer = (questionId, answerId) => {
    setEditingAnswer({ questionId, answerId });
    const question = questions.find((q) => q._id === questionId);
    const answerToEdit = question.answers.find((a) => a._id === answerId);
    setEditingAnswerText(answerToEdit.answer);
    setIsModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAnswerText.trim() || editingAnswerText.trim().length < 5) {
      message.warning("Câu trả lời phải có ít nhất 5 ký tự!");
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/question/${editingAnswer.questionId}/answer/${editingAnswer.answerId}/edit`,
        { answer: editingAnswerText },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      message.success("Đã cập nhật câu trả lời");
      setIsModalVisible(false);
      setIsQuestionModalVisible(false);
      setEditingAnswer(null);
      await fetchQuestions();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Không thể cập nhật câu trả lời"
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingAnswer(null);
    setAnswerText({});
  };

  const handleRemoveQuestion = async (questionId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/question/${questionId}/remove`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      message.success("Đã gỡ câu hỏi.");
      setIsQuestionModalVisible(false);
      await fetchQuestions();
    } catch (error) {
      message.error("Không thể gỡ câu hỏi.");
    }
  };

  const handleRejectQuestion = async (questionId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/question/${questionId}/reject`,
        { saleId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      message.success("Đã từ chối câu hỏi.");
      setIsQuestionModalVisible(false);
      await fetchQuestions();
    } catch (error) {
      message.error("Không thể từ chối câu hỏi.");
    }
  };

  const showQuestionDetail = (question) => {
    setSelectedQuestion(question);
    setIsQuestionModalVisible(true);
  };

  return (
    <div className="manage-questions-container_qa">
      <h2>Quản lý câu hỏi từ khách hàng</h2>

      <div className="question-filter_qa">
        {["all", "pending", "approved", "rejected", "removed"].map((status) => (
          <button
            key={status}
            className={`question-filter-btn_qa ${
              filter === status ? "active" : ""
            }`}
            onClick={() => handleFilterChange(status)}
          >
            {statusTranslations[status]}
          </button>
        ))}
      </div>

      <List
  itemLayout="vertical"
  dataSource={questions}  // Sử dụng trực tiếp từ `questions`
  renderItem={(item) => (
    <List.Item
      key={item._id}
      className="question-item_qa"
      onClick={() => showQuestionDetail(item)}
      data-status={item.status}
    >
      <List.Item.Meta
        avatar={<Avatar>{item.user?.name?.charAt(0)}</Avatar>}
        title={
          <span>
            {item.user?.name} - {moment(item.createdAt).fromNow()}
          </span>
        }
        description={
          <div>
            <div className="question-product_qa">
              <img
                src={item.product?.images[0]}
                alt={item.product?.name}
                style={{ width: 50, height: 50, objectFit: "cover" }}
              />
              <span className="question-product-name_qa">
                {item.product?.name}
              </span>
            </div>
            <div>{item.question}</div>
            <div className="question-stats_qa">
              <span>{item.answers.length} câu trả lời</span>
              <span className={`question-status_qa ${item.status}`}>
                • {statusTranslations[item.status]}
              </span>
            </div>
          </div>
        }
      />
    </List.Item>
  )}
/>
      <Modal
        title="Chi tiết câu hỏi"
        open={isQuestionModalVisible}
        onCancel={() => setIsQuestionModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedQuestion && (
          <div className="question-detail_qa">
            <div className="question-header_qa">
              <Avatar>{selectedQuestion.user?.name?.charAt(0)}</Avatar>
              <div>
                <h4>{selectedQuestion.user?.name}</h4>
                <span>
                  {moment(selectedQuestion.createdAt).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </span>
              </div>
            </div>

            <div className="question-content_qa">
              {selectedQuestion.question}
            </div>

            <div className="answers-section_qa">
              <h4>Câu trả lời ({selectedQuestion.answers.length})</h4>
              {selectedQuestion.answers.map((answer) => (
                <div key={answer._id} className="answer-container_qa">
                  <div className="answer-content_qa">
                    <p>{answer.answer}</p>
                    <span className="answer-time_qa">
                      {moment(answer.createdAt).format("DD/MM/YYYY HH:mm")}
                    </span>
                    {selectedQuestion.status !== "removed" && (
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAnswer(selectedQuestion._id, answer._id);
                        }}
                        className="edit-button_qa"
                      >
                        Chỉnh sửa
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(selectedQuestion.status === "pending" ||
              selectedQuestion.status === "approved") && (
              <div className="answer-input_qa">
                <Input.TextArea
                  value={answerText[selectedQuestion._id] || ""}
                  onChange={(e) =>
                    setAnswerText({
                      ...answerText,
                      [selectedQuestion._id]: e.target.value,
                    })
                  }
                  placeholder="Nhập câu trả lời..."
                  rows={3}
                />
                <div className="button-group_qa">
                  <Button
                    type="primary"
                    onClick={() => handleAnswerQuestion(selectedQuestion._id)}
                  >
                    Trả lời
                  </Button>
                  {selectedQuestion.status === "pending" ? (
                    <Button
                      danger
                      onClick={() => handleRejectQuestion(selectedQuestion._id)}
                    >
                      Từ chối
                    </Button>
                  ) : (
                    <Button
                      danger
                      onClick={() => handleRemoveQuestion(selectedQuestion._id)}
                    >
                      Gỡ câu hỏi
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="Chỉnh sửa câu trả lời"
        open={isModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingAnswer(null);
        }}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Input.TextArea
          value={editingAnswerText}
          onChange={(e) => setEditingAnswerText(e.target.value)}
          rows={4}
        />
      </Modal>

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={totalQuestions}
        onChange={setCurrentPage}
        showSizeChanger
        onShowSizeChange={(current, size) => setPageSize(size)}
      />
    </div>
  );
};

export default ManageQuestions;
