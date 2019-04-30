#define BUZZER_PIN D8
#define RELAY_PIN D4
#define SS_PIN D2
#define RST_PIN D1

#define HISTORY_FILE "/history.txt"
#define IDS_FILE "/ids.txt"

#define ARDUINOJSON_USE_DOUBLE 1

#include <SPI.h>
#include <MFRC522.h>
#include <bits/stdc++.h> 
#include <TaskScheduler.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <cstdlib>

typedef DynamicJsonDocument JSON;
typedef void(*handler)(const JSON&, JSON&);

std::vector<std::string> split(const char* s, char delim) 
{
  std::vector<std::string> result;
  std::stringstream ss(s);
  std::string item;

  while (getline(ss, item, delim)) 
  {
    result.push_back(item);
  }

  return result;
}

void appendToFile(const char* path, const char* line)
{          
  File file = SPIFFS.open(path, "a");

  if (!file)
  {
    Serial.println("There was an error opening the file for writing");
    return;
  }
 
  if (!file.println(line) || !file.print('\n'))
  {
     Serial.println("File write failed");
  }
 
  file.close();  
}

class Scan 
{
  const char* _uuid;
  const char* _timestamp;
  const char* _is_matching;

public:

  Scan(const char* uuid, const char* timestamp, const char* is_matching): 
    _uuid(uuid), _timestamp(timestamp), _is_matching(is_matching) {}

  const char* get_uuid() 
  {
    return _uuid;
  }

  const char* get_timestamp() 
  {
    return _timestamp;
  }

  const char* get_is_matching() 
  {
    return _is_matching;
  }
};

class Identity 
{
  const char* _name;
  const char* _image;
  const char* _uuid;
  const char* _timestamp;

public:

  Identity(const char* name, const char* image, const char* uuid, const char* timestamp): 
    _name(name), _image(image), _uuid(uuid), _timestamp(timestamp) {}

  ~Identity()
  {
    free((void*)_name);
    free((void*)_image);
    free((void*)_uuid);
    free((void*)_timestamp);
  }

  const char* get_name() 
  {
    return _name;
  }

  const char* get_image() 
  {   
    return _image;
  }

  const char* get_uuid() 
  {
    return _uuid;
  }

  const char* get_timestamp() 
  {
    return _timestamp;
  }
};

MFRC522 mfrc522(SS_PIN, RST_PIN);

double sync = 0;

std::unordered_map<std::string, Identity*> ids;
std::unordered_map<std::string, handler> operations;
std::deque<Scan*> history;

bool is_register_mode = false;
bool is_on = false;

void sync_time(const JSON& input, JSON& output)
{
  long long milliseconds = input["milliseconds"];

  sync = milliseconds - millis();
}

const char* get_milliseconds()
{
  long long milliseconds = sync + millis();

  char* buffer = new char[32];

  sprintf(buffer, "%lld", milliseconds);
  
  return buffer;
}

void toggle_register_mode(const JSON& input, JSON& output)
{
  is_register_mode = !is_register_mode;
}

void delete_uuid(const JSON& input, JSON& output)
{
  const char* uuid = input["uuid"];

  const auto& it = ids.find(uuid);
  delete it->second;
  
  ids.erase(it);

  SPIFFS.remove(IDS_FILE);

  for (const auto& id: ids)
  {
    const char* uuid = id.second->get_uuid();
    const char* name = id.second->get_name();
    const char* image = id.second->get_image();
    const char* timestamp = id.second->get_timestamp();
    
    char line_buffer[strlen(name) + strlen(image) + strlen(uuid) + strlen(timestamp) + 5];

    sprintf(
      line_buffer, 
      "%s %s %s %s", 
      name,
      image,
      uuid,
      timestamp
    );

    appendToFile(IDS_FILE, line_buffer);
  }
}

void register_id(const JSON& input, JSON& output)
{
  const char* name = strdup(input["name"]);
  const char* image = strdup(input["image"]);
  const char* uuid = strdup(input["uuid"]);
  const char* timestamp = strdup(input["timestamp"]);

  ids[uuid] = new Identity(name, image, uuid, timestamp);

  char line_buffer[strlen(name) + strlen(image) + strlen(uuid) + strlen(timestamp) + 5];

  sprintf(
    line_buffer, 
    "%s %s %s %s", 
    name,
    image,
    uuid,
    timestamp
  );

  appendToFile(IDS_FILE, line_buffer);
}

void read_RFID() 
{
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

  std::string uuid = uuid_buffer.substr(1);

  if (is_register_mode) 
  {
    is_register_mode = false;
    JSON output(256);

    output["uuid"] = uuid.c_str();
    output["type"] = "scan";

    serializeJson(output, Serial);
    Serial.println();

    tone(BUZZER_PIN, 4000);
    delay(100);
    noTone(BUZZER_PIN);
    delay(100);
    tone(BUZZER_PIN, 4000);
    delay(100);
    noTone(BUZZER_PIN);
    delay(100);
    tone(BUZZER_PIN, 4000);
    delay(100);
    noTone(BUZZER_PIN);
  }
  else
  {
    bool is_matching = ids.find(uuid) != ids.end();

    JSON output(256);

    const char* timestamp = get_milliseconds();

    output["uuid"] = uuid.c_str();
    output["timestamp"] = timestamp;
    output["type"] = "scan";
    output["isMatching"] = is_matching ? "true" : "false";

    char output_buffer[256];
    serializeJson(output, output_buffer);

// this should be handled
//    if (history.size() > 255)
//    {
//      history.pop_back();
//    }

    history.push_front(new Scan(strdup(uuid.c_str()), strdup(timestamp),  is_matching ? "true" : "false"));
    Serial.println(output_buffer);

    char line_buffer[uuid.size() + 32];

    sprintf(line_buffer, "%s %s %s", uuid.c_str(), timestamp, is_matching ? "true" : "false");

    appendToFile(HISTORY_FILE, line_buffer);

    if (is_matching)
    {
      tone(BUZZER_PIN, 4000);
      delay(300);
      noTone(BUZZER_PIN);
      
      digitalWrite(RELAY_PIN, is_on ? HIGH : LOW);
      is_on = !is_on;
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

  delay(5000);
}

void serial_communication() 
{
  if (Serial.available())
  {
    String payload = Serial.readString().c_str();
    
    JSON input(256); 

    if (deserializeJson(input, payload) != DeserializationError::Ok) 
    {
      Serial.println("JSON parsing failed");
      return;
    }

    JSON output(10000);

    const char* type = input["type"];
    
    output["type"] = type;
    operations[type](input, output);
    
    serializeJson(output, Serial);
    Serial.println();
  }
}

void get_data(const JSON& input, JSON& output)
{
  const JsonArray& data_ids = output.createNestedArray("ids");
      
  for (const auto& id: ids) 
  {
    const JsonObject& json = data_ids.createNestedObject();
    
    json["uuid"] = id.second->get_uuid();
    json["name"] = id.second->get_name();
    json["image"] = id.second->get_image();
    json["timestamp"] = id.second->get_timestamp();
  }

  const JsonArray& data_history = output.createNestedArray("history");
      
  for (const auto& scan: history) 
  {
    const JsonObject& json = data_history.createNestedObject();
    
    json["uuid"] = scan->get_uuid();
    json["timestamp"] = scan->get_timestamp();
    json["isMatching"] = scan->get_is_matching();
  }
}

void parseHistory() 
{
  File file = SPIFFS.open(HISTORY_FILE, "r");

  if (!file)
  {
    Serial.println(String(HISTORY_FILE) + " does not exist");
    return;
  }

  char buffer[512];
  
  while (file.available()) 
  {
    int l = file.readBytesUntil('\n', buffer, sizeof(buffer));
    buffer[l] = 0;

    Serial.println(String(buffer));

    std::vector<std::string> data = split(buffer, ' ');
    
    const char* uuid = strdup(data[0].c_str());
    const char* timestamp = strdup(data[1].c_str());
    const char* is_matching = strdup(data[2].c_str());

    history.push_front(new Scan(uuid, timestamp, is_matching));
  }
}

void parseIds() 
{
  File file = SPIFFS.open(IDS_FILE, "r");

  if (!file)
  {
    Serial.println(String(IDS_FILE) + " does not exist");
    return;
  }

  char buffer[512];
  
  while (file.available()) 
  {
    int l = file.readBytesUntil('\n', buffer, sizeof(buffer));
    buffer[l] = 0;

    std::vector<std::string> data = split(buffer, ' ');

    const char* name = strdup(data[0].c_str());
    const char* image = strdup(data[1].c_str());
    const char* uuid = strdup(data[2].c_str());
    const char* timestamp = strdup(data[3].c_str());

    ids[uuid] = new Identity(name, image, uuid, timestamp);
  }
}
 
Scheduler runner;

Task RFID_task(100, TASK_FOREVER, &read_RFID);
Task communication_task(100, TASK_FOREVER, &serial_communication);
 
void setup() 
{
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  SPIFFS.begin();
//  SPIFFS.format();
  SPI.begin();
  
  mfrc522.PCD_Init();
  
  pinMode(BUZZER_PIN, OUTPUT);

  operations["get"] = get_data;
  operations["toggleRegister"] = toggle_register_mode;
  operations["register"] = register_id;
  operations["deleteUuid"] = delete_uuid;
  operations["syncTime"] = sync_time;
  
  runner.init();

  runner.addTask(RFID_task);
  runner.addTask(communication_task);

  RFID_task.enable();
  communication_task.enable();

  parseHistory();
  parseIds();
}

void loop() 
{
  runner.execute();
} 
