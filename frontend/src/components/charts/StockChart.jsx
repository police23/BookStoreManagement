import React, { useState, useEffect } from "react";
import "./StockChart.css";
import { getOldStockBooks } from "../../services/BookService";

const StockTable = ({ data }) => {
  // State cho sắp xếp
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc", table: "main" });
  const [sortClickCount, setSortClickCount] = useState(0);
  const [oldStockBooks, setOldStockBooks] = useState([]);

  // Lấy dữ liệu sách tồn kho lâu ngày từ API
  useEffect(() => {
    const fetchOldStockBooks = async () => {
      try {
        if (data && data.books) {
          const oldBooks = await getOldStockBooks(2);
          setOldStockBooks(oldBooks);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sách tồn kho lâu ngày:", error);
        setOldStockBooks([]);
      }
    };
    
    fetchOldStockBooks();
  }, [data]);

  // Hàm sắp xếp
  const getSorted = (arr, table) => {
    if (!sortConfig.key || sortConfig.table !== table) return arr;
    const sorted = [...arr].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // Hàm xử lý khi click header
  const handleSort = (key, table) => {
    setSortConfig((prev) => {
      if (prev.key === key && prev.direction === "asc" && prev.table === table) {
        setSortClickCount((c) => c + 1);
        return { key, direction: "desc", table };
      }
      if (prev.key === key && prev.direction === "desc" && prev.table === table) {
        setSortClickCount((c) => c + 1);
        return { key: null, direction: "asc", table };
      }
      setSortClickCount(1);
      return { key, direction: "asc", table };
    });
  };

  if (!data)
    return (
      <div className="no-data-message">
        Không có dữ liệu cho báo cáo này.
      </div>
    );

  const books = data.books || [];

  // Tổng số sách tồn
  const totalBooks = books.reduce((sum, b) => sum + b.stock, 0);
  // Tổng giá trị tồn kho
  const totalValue = books.reduce((sum, b) => sum + b.stock * b.price, 0);

  return (
    <div className="import-table-container">
      <h3 className="stock-table-title">Bảng tồn kho từng đầu sách</h3>
      

      <table className="import-table stock-table">
        <thead>
          <tr>
            <th onClick={() => handleSort(null, "main")}>STT</th>
            <th onClick={() => handleSort("title", "main")}>Tên sách {sortConfig.key === "title" && sortConfig.table === "main" ? (sortConfig.direction === "asc" ? "▲" : "▼") : null}</th>
            <th onClick={() => handleSort("category", "main")}>Thể loại {sortConfig.key === "category" && sortConfig.table === "main" ? (sortConfig.direction === "asc" ? "▲" : "▼") : null}</th>
            <th onClick={() => handleSort("stock", "main")}>Số lượng tồn {sortConfig.key === "stock" && sortConfig.table === "main" ? (sortConfig.direction === "asc" ? "▲" : "▼") : null}</th>
            <th onClick={() => handleSort("value", "main")}>Giá trị tồn kho {sortConfig.key === "value" && sortConfig.table === "main" ? (sortConfig.direction === "asc" ? "▲" : "▼") : null}</th>
          </tr>
        </thead>
        <tbody>
          {getSorted(books.map(b => ({ ...b, value: b.stock * b.price })), "main").length > 0 ? (
            getSorted(books.map(b => ({ ...b, value: b.stock * b.price })), "main").map((book, idx) => (
              <tr key={book.title}>
                <td>{idx + 1}</td>
                <td>{book.title}</td>
                <td>{book.category || "-"}</td>
                <td className={book.stock <= 3 ? "stock-low" : undefined}>{book.stock}</td>
                <td>{book.value.toLocaleString("vi-VN")}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center">
                Không có dữ liệu sách tồn kho.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="footer-total-cell">Tổng:</td>
            <td className="footer-value-cell">{totalBooks}</td>
            <td className="footer-value-cell">{totalValue.toLocaleString("vi-VN")} VNĐ</td>
          </tr>
        </tfoot>
      </table>

      <h3 className="stock-table-title old-stock-title">Sách tồn kho lâu ngày (trên 2 tháng chưa được bán ra)</h3>
      <table className="import-table stock-table">
        <thead>
          <tr>
            <th onClick={() => handleSort(null, "old")}>STT</th>
            <th onClick={() => handleSort("title", "old")}>Tên sách {sortConfig.key === "title" && sortConfig.table === "old" ? (sortConfig.direction === "asc" ? "▲" : "▼") : null}</th>
            <th onClick={() => handleSort("category", "old")}>Thể loại {sortConfig.key === "category" && sortConfig.table === "old" ? (sortConfig.direction === "asc" ? "▲" : "▼") : null}</th>
            <th onClick={() => handleSort("stock", "old")}>Số lượng tồn {sortConfig.key === "stock" && sortConfig.table === "old" ? (sortConfig.direction === "asc" ? "▲" : "▼") : null}</th>
            <th onClick={() => handleSort("value", "old")}>Giá trị tồn kho {sortConfig.key === "value" && sortConfig.table === "old" ? (sortConfig.direction === "asc" ? "▲" : "▼") : null}</th>
          </tr>
        </thead>
        <tbody>
          {getSorted(oldStockBooks.map(b => ({ ...b, value: b.stock * b.price })), "old").length > 0 ? (
            getSorted(oldStockBooks.map(b => ({ ...b, value: b.stock * b.price })), "old").map((book, idx) => (
              <tr key={book.title}>
                <td>{idx + 1}</td>
                <td>{book.title}</td>
                <td>{book.category || "-"}</td>
                <td>{book.stock}</td>
                <td>{book.value.toLocaleString("vi-VN")}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center">
                Không có sách tồn kho lâu ngày.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
