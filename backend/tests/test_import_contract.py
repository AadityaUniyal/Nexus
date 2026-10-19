import pytest

from app.services.import_service import MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, parse_import_file


def test_import_parser_accepts_only_csv_and_json_extensions():
    with pytest.raises(ValueError, match="Only CSV and JSON"):
        parse_import_file("name\nTruck\n", "fleet.xlsx")


def test_import_parser_enforces_encoded_file_size_limit():
    content = "a" * (MAX_IMPORT_BYTES + 1)
    with pytest.raises(ValueError, match="10 MB or smaller"):
        parse_import_file(content, "large.csv")


def test_import_parser_enforces_row_limit_for_json_and_csv():
    csv_content = "code\n" + "x\n" * (MAX_IMPORT_ROWS + 1)
    with pytest.raises(ValueError, match="at most 10,000 data rows"):
        parse_import_file(csv_content, "large.csv")

    json_content = '[{"code":"x"},' + '{"code":"x"},' * MAX_IMPORT_ROWS + '{"code":"x"}]'
    with pytest.raises(ValueError, match="at most 10,000 data rows"):
        parse_import_file(json_content, "large.json")
