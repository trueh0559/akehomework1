
# แผนแก้ไขไอคอน Face Slider (หน้าเปลี่ยนตามคะแนน)

## สรุปปัญหา
โค้ดใน `FaceSliderRenderer.tsx` ยังไม่ได้รับการแก้ไขให้สอดคล้องกับคะแนน 1-5 มีหลายจุดที่ยังใช้ค่า 0-10 อยู่

## การแก้ไข

### 1. แก้ไข FaceSliderRenderer.tsx

**1.1 อัปเดต DEFAULT_FACES (บรรทัด 22-28)**
เปลี่ยนจาก:
```typescript
const DEFAULT_FACES: FaceConfig[] = [
  { min: 0, max: 2, emoji: "😠", text: "ไม่พอใจมาก" },
  { min: 2, max: 4, emoji: "😟", text: "ไม่พอใจ" },
  { min: 4, max: 6, emoji: "😐", text: "ปานกลาง" },
  { min: 6, max: 8, emoji: "🙂", text: "พอใจ" },
  { min: 8, max: 10, emoji: "😍", text: "พอใจมาก" },
];
```
เป็น:
```typescript
const DEFAULT_FACES: FaceConfig[] = [
  { min: 1, max: 1, emoji: "😠", text: "ไม่พอใจมาก" },
  { min: 2, max: 2, emoji: "😟", text: "ไม่พอใจ" },
  { min: 3, max: 3, emoji: "😐", text: "ปานกลาง" },
  { min: 4, max: 4, emoji: "🙂", text: "พอใจ" },
  { min: 5, max: 5, emoji: "😍", text: "พอใจมาก" },
];
```

**1.2 แก้ไข Default values (บรรทัด 31-36)**
เปลี่ยนจาก:
```typescript
const min = config.min ?? 0;
const max = config.max ?? 10;
const step = config.step ?? 1;
const faces = config.faces || DEFAULT_FACES;
const currentValue = value?.score ?? 5;
```
เป็น:
```typescript
const min = config.min ?? 1;
const max = config.max ?? 5;
const step = config.step ?? 1;
const faces = config.faces || DEFAULT_FACES;
const currentValue = value?.score ?? 3; // Default กลาง = 3
```

**1.3 แก้ไข Logic หา currentFace (บรรทัด 38-40)**
เปลี่ยนจาก:
```typescript
const currentFace = useMemo(() => {
  return faces.find((f) => currentValue >= f.min && currentValue < f.max) || faces[faces.length - 1];
}, [currentValue, faces]);
```
เป็น:
```typescript
const currentFace = useMemo(() => {
  return faces.find((f) => currentValue >= f.min && currentValue <= f.max) || faces[faces.length - 1];
}, [currentValue, faces]);
```

### 2. แก้ไข QuestionEditor.tsx (บรรทัด 114, 122)
เปลี่ยน default values ในฟอร์มแก้ไขคำถาม:
- `config.min ?? 0` → `config.min ?? 1`
- `config.max ?? 10` → `config.max ?? 5`

## รายการไฟล์ที่ต้องแก้ไข
| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `src/components/surveys/FaceSliderRenderer.tsx` | อัปเดต DEFAULT_FACES, default values, และ logic หา face |
| `src/components/surveys/QuestionEditor.tsx` | แก้ไข default values ในฟอร์ม face_slider_continuous |

## ผลลัพธ์ที่คาดหวัง
- คะแนนจะอยู่ในช่วง 1-5
- ค่า default คือ 3 (กลาง)
- ไอคอนจะแสดงถูกต้อง: 😠(1) → 😟(2) → 😐(3) → 🙂(4) → 😍(5)
- หน้าซ้าย = ไม่พอใจมาก (😠), หน้าขวา = พอใจมาก (😍)
