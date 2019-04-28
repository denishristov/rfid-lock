#define BUZZER_PIN D8
#define SS_PIN D2
#define RST_PIN D1

#include <SPI.h>
#include <MFRC522.h>
#include <bits/stdc++.h> 
#include <TaskScheduler.h>
#include <ArduinoJson.h>

typedef DynamicJsonDocument JSON;
typedef void(*handler)(const JSON&, JSON&);

MFRC522 mfrc522(SS_PIN, RST_PIN);

std::unordered_set<std::string> ids;
std::unordered_map<std::string, handler> operations;
std::deque<std::string> history;

void read_RFID() {
  if (!mfrc522.PICC_IsNewCardPresent()) 
  {
    return;
  }
  
  if (!mfrc522.PICC_ReadCardSerial()) 
  {
    return;
  }

  std::string uuid_buffer;
  uuid_buffer.reserve(16);
  
  for (byte i = 0; i < mfrc522.uid.size; i++) 
  {
    uuid_buffer.append(mfrc522.uid.uidByte[i] < 0x10 ? "-0" : "-");
    uuid_buffer.append(String(mfrc522.uid.uidByte[i], HEX).c_str());
  }

  const char* uuid = uuid_buffer.substr(1).c_str();
  bool is_matching = ids.find(uuid_buffer.substr(1)) != ids.end();
  
  JSON output(256);
  
  output["type"] = "scan";
  output["isMatching"] = is_matching;
  output["uuid"] = uuid;

  char output_buffer[256];
  serializeJson(output, output_buffer);
  
  if (history.size() > 255)
  {
    history.pop_back();
  }
  
  history.push_front(output_buffer);
  Serial.println(output_buffer);
  
  if (is_matching)
  {
    tone(BUZZER_PIN, 4000);
    delay(300);
    noTone(BUZZER_PIN);
  } 
  else 
  {
    tone(BUZZER_PIN, 500);
    delay(100);
    noTone(BUZZER_PIN);
    delay(50);
    tone(BUZZER_PIN, 500);
    delay(100);
    noTone(BUZZER_PIN);
  }
}

void serial_communication() {
  if (Serial.available())
  {
    String payload = Serial.readString().c_str();
    
    JSON input(256); 

    if (deserializeJson(input, payload) != DeserializationError::Ok) 
    {
      Serial.println("JSON parsing failed");
      return;
    }

    JSON output(256);

    const char* type = input["type"];
    
    output["type"] = type;
    operations[type](input, output);
    
    serializeJson(output, Serial);
    Serial.println();
  }
}

void get_all(const JSON& input, JSON& output)
{
  JsonArray data_ids = output.createNestedArray("ids");
      
  for (const auto& id: ids) 
  {
    data_ids.add(id.c_str());
  }

  JsonArray data_history = output.createNestedArray("history");
      
  for (const auto& scan: history) 
  {
    data_history.add(scan.c_str());
  }
}
 
Scheduler runner;

Task RFID_task(100, TASK_FOREVER, &read_RFID);
Task communication_task(100, TASK_FOREVER, &serial_communication);
 
void setup() 
{
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  
  pinMode(BUZZER_PIN, OUTPUT);

  ids.insert("e4-10-6a-1f");

  operations["get"] = get_all;
  
  runner.init();

  runner.addTask(RFID_task);
  runner.addTask(communication_task);

  RFID_task.enable();
  communication_task.enable();
}

void loop() 
{
  runner.execute();
} 
