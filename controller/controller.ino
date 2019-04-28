#define BUZZER_PIN D8
#define SS_PIN D2
#define RST_PIN D1

#include <SPI.h>
#include <MFRC522.h>
#include <bits/stdc++.h> 
#include <TaskScheduler.h>
#include <ArduinoJson.h>

typedef void(*handler)(const DynamicJsonDocument&, DynamicJsonDocument&);

MFRC522 mfrc522(SS_PIN, RST_PIN);
std::unordered_set<std::string> ids;
std::unordered_map<std::string, handler> operations;

void read_RFID() {
  if (!mfrc522.PICC_IsNewCardPresent()) 
  {
    return;
  }
  
  if (!mfrc522.PICC_ReadCardSerial()) 
  {
    return;
  }

  Serial.print("UID tag: ");
  std::string content = "";
  
  for (byte i = 0; i < mfrc522.uid.size; i++) 
  {
    content.append(mfrc522.uid.uidByte[i] < 0x10 ? "-0" : "-");
    content.append(String(mfrc522.uid.uidByte[i], HEX).c_str());
  }
  
  Serial.println(content.substr(1).c_str());
  Serial.print("Message: ");
  
  if (ids.find(content.substr(1)) != ids.end())
  {
    Serial.println("Authorized access");
    Serial.println();
    tone(BUZZER_PIN, 4000);
    delay(300);
    noTone(BUZZER_PIN);
  } 
  else 
  {
    Serial.println("Access denied");
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
    
    DynamicJsonDocument input(256); 
    DynamicJsonDocument output(256);

    if (deserializeJson(input, payload) != DeserializationError::Ok) 
    {
      Serial.println("JSON parsing failed");
      return;
    }

    const char* type = input["type"];
    operations[type](input, output);
    
    serializeJson(output, Serial);
    Serial.println();
  }
}

void get_all_ids(const DynamicJsonDocument& input, DynamicJsonDocument& output)
{
  JsonArray data = output.createNestedArray("ids");
      
  for (const auto& id: ids) 
  {
    data.add(id.c_str());
  }
}
 
Scheduler runner;

Task RFID_task(100, TASK_FOREVER, &read_RFID);
Task print_task(100, TASK_FOREVER, &serial_communication);
 
void setup() 
{
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  
  pinMode(BUZZER_PIN, OUTPUT);

  ids.insert("e4-10-6a-1f");

  operations["get"] = get_all_ids;

  runner.init();

  runner.addTask(RFID_task);
  runner.addTask(print_task);

  RFID_task.enable();
  print_task.enable();
}

void loop() 
{
  runner.execute();
} 
